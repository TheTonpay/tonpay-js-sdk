import {
  DeeplinkFormat,
  INVOICE_CODE,
  STORE_CODE,
  STORE_VERSION,
  StoreConfig,
  StoreData,
  StoreWrapper,
  ZERO_ADDRESS,
  buildActivateStoreMessage,
  buildDeactivateStoreMessage,
  buildEditStoreMessage,
  buildFullCodeUpgradeMessage,
  buildInvoiceCodeUpgradeMessage,
  buildIssueInvoiceMessage,
  buildRequestPurchaseMessage,
  buildUserPaymentLink,
  precalculateInvoiceAddress,
} from "@tonpay/core";
import { TonClient } from "ton";
import { Address, Cell, OpenedContract, Sender, toNano } from "ton-core";
import { InvoiceInfo, PurchaseRequestInvoice } from "../types/invoice";

export const StoreFees = {
  DEPLOY: toNano("0.005"),
  EDIT: toNano("0.005"),
  ACTIVATE: toNano("0.005"),
  DEACTIVATE: toNano("0.005"),
  ISSUE_INVOICE: toNano("0.02"),
  REQUEST_PURCHASE: toNano("0.05"),
  FULL_UPGRADE: toNano("0.006"),
  INVOICE_UPGRADE: toNano("0.006"),
};

export class Store {
  private wrapper: StoreWrapper;
  private sender: Sender;
  private openedContract: OpenedContract<StoreWrapper>;
  private tonClient: TonClient;

  public constructor(address: string, sender: Sender, tonClient: TonClient) {
    this.wrapper = StoreWrapper.createFromAddress(Address.parse(address));
    this.sender = sender;
    this.tonClient = tonClient;
    this.openedContract = this.tonClient.open(this.wrapper);
  }

  async create(config: StoreConfig) {
    this.wrapper = StoreWrapper.createFromConfig(
      config,
      Cell.fromBase64(STORE_CODE)
    );
    this.openedContract = this.tonClient.open(this.wrapper);

    await this.openedContract.sendDeploy(this.sender, StoreFees.DEPLOY);
  }

  async edit(
    name: string,
    description: string,
    image: string,
    webhook: string,
    mccCode: number
  ) {
    await this.openedContract.sendEditStore(this.sender, {
      value: StoreFees.EDIT,
      message: buildEditStoreMessage(
        name,
        description,
        image,
        webhook,
        mccCode
      ),
    });
  }

  async activate() {
    await this.openedContract.sendActivateStore(this.sender, {
      value: StoreFees.ACTIVATE,
      message: buildActivateStoreMessage(),
    });
  }

  async deactivate() {
    await this.openedContract.sendActivateStore(this.sender, {
      value: StoreFees.DEACTIVATE,
      message: buildDeactivateStoreMessage(),
    });
  }

  async issueInvoice(invoice: InvoiceInfo) {
    await this.openedContract.sendIssueInvoice(this.sender, {
      value: StoreFees.ISSUE_INVOICE,
      message: buildIssueInvoiceMessage(
        invoice.hasCustomer,
        invoice.customer,
        invoice.invoiceId,
        invoice.metadata,
        BigInt(invoice.amount)
      ),
    });
  }

  async requestPurchase(invoice: PurchaseRequestInvoice) {
    await this.openedContract.sendRequestPurchase(this.sender, {
      value: toNano(`${invoice.amount}`) + StoreFees.REQUEST_PURCHASE,
      message: buildRequestPurchaseMessage(
        invoice.invoiceId,
        toNano(`${invoice.amount}`),
        invoice.metadata
      ),
    });
    const merchantAddress = await this.getOwner();
    return precalculateInvoiceAddress(
      this.wrapper.address.toString(),
      merchantAddress.toString(),
      false,
      ZERO_ADDRESS,
      invoice.invoiceId,
      invoice.metadata ?? "",
      Number(toNano(`${invoice.amount}`))
    );
  }

  getRequestPurchaseLink(
    invoice: PurchaseRequestInvoice,
    format: DeeplinkFormat = "ton"
  ) {
    return buildUserPaymentLink(
      this.wrapper.address.toString(),
      invoice.amount,
      invoice.invoiceId,
      Number(StoreFees.REQUEST_PURCHASE),
      format
    );
  }

  async applyUpdate(newStoreData: Cell | null) {
    await this.openedContract.sendFullCodeUpgrade(this.sender, {
      value: StoreFees.FULL_UPGRADE,
      message: buildFullCodeUpgradeMessage(
        Cell.fromBase64(STORE_CODE),
        Cell.fromBase64(INVOICE_CODE),
        newStoreData != null,
        newStoreData
      ),
    });
  }

  async applyInvoiceUpdate() {
    await this.openedContract.sendInvoiceCodeUpgrade(this.sender, {
      value: StoreFees.INVOICE_UPGRADE,
      message: buildInvoiceCodeUpgradeMessage(Cell.fromBase64(INVOICE_CODE)),
    });
  }

  getOwner(): Promise<Address> {
    return this.openedContract.getStoreOwner();
  }

  getName(): Promise<string> {
    return this.openedContract.getStoreName();
  }

  getDescription(): Promise<string> {
    return this.openedContract.getStoreDescription();
  }

  getImage(): Promise<string> {
    return this.openedContract.getStoreImage();
  }

  getWebhook(): Promise<string> {
    return this.openedContract.getStoreWebhook();
  }

  getMccCode(): Promise<number> {
    return this.openedContract.getStoreMccCode();
  }

  isActive(): Promise<boolean> {
    return this.openedContract.getStoreActive();
  }

  getVersion(): Promise<number> {
    return this.openedContract.getStoreVersion();
  }

  async getInvoiceCode(asBase64 = false): Promise<Cell | string> {
    const code = await this.openedContract.getStoreInvoiceCode();
    return asBase64 ? code.toBoc().toString("base64") : code;
  }

  getData(version: number = STORE_VERSION): Promise<StoreData> {
    return this.openedContract.getStoreData(version);
  }

  async shouldUpgradeSelf(): Promise<boolean> {
    const version = await this.getVersion();
    return version < STORE_VERSION;
  }

  async shouldUpgradeInvoice(): Promise<boolean> {
    const invoiceCode = await this.getInvoiceCode(true);
    return invoiceCode !== INVOICE_CODE;
  }
}
