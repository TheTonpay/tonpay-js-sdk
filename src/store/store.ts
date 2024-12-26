import {
  DeeplinkFormat,
  INVOICE_CODE,
  JettonWalletWrapper,
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
  buildRequestPurchaseWithJettonsMessage,
  isAddress,
  precalculateInvoiceAddress,
  buildUserPaymentWithJettonsLink,
} from "@tonpay/core";
import { TonClient } from "ton";
import { Address, Cell, OpenedContract, Sender, toNano } from "ton-core";
import { InvoiceInfo, PurchaseRequestInvoice } from "../types/invoice";
import { Invoice } from "../invoice/invoice";
import { Currencies } from "../currency/currencies";

export const StoreFees = {
  DEPLOY: toNano("0.005"),
  EDIT: toNano("0.005"),
  ACTIVATE: toNano("0.005"),
  DEACTIVATE: toNano("0.005"),
  ISSUE_INVOICE: toNano("0.042"),
  REQUEST_PURCHASE: toNano("0.055"),
  FULL_UPGRADE: toNano("0.006"),
  INVOICE_UPGRADE: toNano("0.006"),
  REQUEST_PURCHASE_JETTON: toNano("0.6"),
};

export class Store {
  private wrapper: StoreWrapper;
  private sender?: Sender;
  private openedContract: OpenedContract<StoreWrapper>;
  private tonClient: TonClient;

  public address: string;

  public constructor(address: string, tonClient: TonClient, sender?: Sender, ) {
    this.wrapper = StoreWrapper.createFromAddress(Address.parse(address));
    this.address = address;
    this.sender = sender;
    this.tonClient = tonClient;
    this.openedContract = this.tonClient.open(this.wrapper);
  }

  async create(config: StoreConfig) {
    if (!this.sender) {
      throw Error("This store is read-only. Pass the sender to the constructor to make changes.")
    }

    this.wrapper = StoreWrapper.createFromConfig(
      config,
      Cell.fromBase64(STORE_CODE)
    );
    this.address = this.wrapper.address.toString();
    this.openedContract = this.tonClient.open(this.wrapper);

    await this.openedContract.sendDeploy(this.sender, StoreFees.DEPLOY);
  }

  /**
   * @description This method edits the store data
   *
   * @param name - New store name
   * @param description - New store description
   * @param image - New store image URL
   * @param webhook - New store webhook URL
   * @param mccCode - New store MCC code
   *
   * @example
   * ```typescript
   * await store.edit(
   *     "New store name",
   *     "New store description",
   *     "https://example.com/logo.png",
   *     "https://example.com/webhook",
   *     1337
   * );
   * ```
   *
   **/
  async edit(
    name: string,
    description: string,
    image: string,
    webhook: string,
    mccCode: number
  ) {
    if (!this.sender) {
      throw Error("This store is read-only. Pass the sender to the constructor to make changes.")
    }
    
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

  /**
   * @description This method activates the store
   *
   * @example
   * ```typescript
   *
   * await store.activate();
   * ```
   */
  async activate() {
    if (!this.sender) {
      throw Error("This store is read-only. Pass the sender to the constructor to make changes.")
    }
    
    await this.openedContract.sendActivateStore(this.sender, {
      value: StoreFees.ACTIVATE,
      message: buildActivateStoreMessage(),
    });
  }

  /**
   * @description This method deactivates the store
   *
   * @example
   * ```typescript
   *
   * await store.deactivate();
   * ```
   */
  async deactivate() {
    if (!this.sender) {
      throw Error("This store is read-only. Pass the sender to the constructor to make changes.")
    }
    
    await this.openedContract.sendActivateStore(this.sender, {
      value: StoreFees.DEACTIVATE,
      message: buildDeactivateStoreMessage(),
    });
  }

  /**
   * @description This method issues the invoice
   *
   * @param {InvoiceInfo} invoice - invoice info. Amount must be specified in TON, not nanoTON!
   *
   * @returns {Promise<Invoice>} Invoice object after the transaction is sent
   *
   * @example
   * ```typescript
   * const invoice = await store.issueInvoice({
   *     hasCustomer: true, // can be false, in which case anyone will be able to pay the invoice
   *     customer: "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N", // can be ZERO_ADDRESS if hasCustomer is false
   *     invoiceId: "in_abcdef123456",
   *     metadata: "",
   *     amount: 4.2,
   *     currency: Currencies.jUSDT
   * });
   * ```
   */
  async issueInvoice(invoice: InvoiceInfo): Promise<Invoice> {
    if (!this.sender) {
      throw Error("This store is read-only. Pass the sender to the constructor to make changes.")
    }
    
    await this.openedContract.sendIssueInvoice(this.sender, {
      value: StoreFees.ISSUE_INVOICE,
      message: buildIssueInvoiceMessage(
        invoice.hasCustomer,
        invoice.customer,
        invoice.invoiceId,
        invoice.metadata,
        BigInt(invoice.amount * Math.pow(10, invoice.currency.decimals)),
        invoice.currency == Currencies.TON,
        invoice.currency.address,
        invoice.currency.walletCode
      ),
    });

    const merchantAddress = await this.getOwner();
    return new Invoice(
      precalculateInvoiceAddress(
        this.wrapper.address.toString(),
        merchantAddress.toString(),
        invoice.hasCustomer,
        invoice.customer,
        invoice.invoiceId,
        invoice.metadata,
        invoice.amount * Math.pow(10, invoice.currency.decimals),
        invoice.currency == Currencies.TON,
        invoice.currency.address,
        invoice.currency.walletCode
      ).toString(),
      this.tonClient,
      this.sender
    );
  }

  /**
   * @description This method makes a purchase request to the store from the customer's side.
   *
   * @param invoice {PurchaseRequestInvoice} - invoice info. Amount must be specified in TON, not nanoTON!
   *
   * @returns {Promise<Invoice>} Invoice object after the transaction is sent
   *
   * @example
   * ```typescript
   * const invoice = await store.requestPurchase({
   *   invoiceId: "in_abcdef123456",
   *   metadata: "",
   *   amount: 4.2,
   *   currency: Currencies.TON
   * });
   * ```
   *
   * @example
   * ```typescript
   * const invoice = await store.requestPurchase({
   *   invoiceId: "in_abcdef123456",
   *   metadata: "",
   *   amount: 4.2,
   *   currency: Currencies.jUSDT,
   *   customer: "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"
   * });
   */
  async requestPurchase(invoice: PurchaseRequestInvoice): Promise<Invoice> {
    if (!this.sender) {
      throw Error("This store is read-only. Pass the sender to the constructor to make changes.")
    }
    
    const merchantAddress = await this.getOwner();

    if (invoice.currency == Currencies.TON) {
      await this.openedContract.sendRequestPurchase(this.sender, {
        value: toNano(`${invoice.amount}`) + StoreFees.REQUEST_PURCHASE,
        message: buildRequestPurchaseMessage(
          invoice.invoiceId,
          toNano(`${invoice.amount}`),
          invoice.metadata
        ),
      });
      return new Invoice(
        precalculateInvoiceAddress(
          this.wrapper.address.toString(),
          merchantAddress.toString(),
          false,
          ZERO_ADDRESS,
          invoice.invoiceId,
          invoice.metadata ?? "",
          invoice.amount * Math.pow(10, invoice.currency.decimals),
          invoice.currency !== Currencies.TON,
          invoice.currency.address,
          invoice.currency.walletCode
        ).toString(),
        this.tonClient,
        this.sender
      );
    }

    if (!invoice.customer) {
      throw new Error("Customer address is required");
    }

    if (!isAddress(invoice.customer)) {
      throw new Error("Customer address is not a TON address");
    }

    const jettonWallet = this.tonClient.open(
      JettonWalletWrapper.createFromConfig(
        {
          balance: 0,
          masterAddress: invoice.currency.address,
          ownerAddress: invoice.customer,
          walletCode: invoice.currency.walletCode,
        },
        invoice.currency.walletCode
      )
    );
    await jettonWallet.sendJettons(this.sender, {
      value: StoreFees.REQUEST_PURCHASE_JETTON,
      message: buildRequestPurchaseWithJettonsMessage(
        invoice.invoiceId,
        BigInt(invoice.amount * Math.pow(10, invoice.currency.decimals)),
        invoice.metadata,
        this.address,
        invoice.currency.address,
        invoice.currency.walletCode
      ),
    });

    return new Invoice(
      precalculateInvoiceAddress(
        this.wrapper.address.toString(),
        merchantAddress.toString(),
        false,
        ZERO_ADDRESS,
        invoice.invoiceId,
        invoice.metadata ?? "",
        invoice.amount * Math.pow(10, invoice.currency.decimals),
        true,
        invoice.currency.address,
        invoice.currency.walletCode
      ).toString(),
      this.tonClient,
      this.sender
    );
  }

  /**
   * @description This method returns the universal link for the purchase request by customer.
   *
   * @param invoice {PurchaseRequestInvoice} - invoice info.
   * @param format {DeeplinkFormat} - deeplink format. Default is "ton", can be "ton" or "tonkeeper"
   *
   * @returns {string} Universal payment link for the purchase request
   *
   * @example
   * ```typescript
   * const link = store.getRequestPurchaseLink({
   *   invoiceId: "in_abcdef123456",
   *   metadata: "",
   *   amount: 4.2
   * });
   * ```
   */
  getRequestPurchaseLink(
    invoice: PurchaseRequestInvoice,
    format: DeeplinkFormat = "ton"
  ): string {
    if (invoice.currency == Currencies.TON) {
      return buildUserPaymentLink(
        this.wrapper.address.toString(),
        invoice.amount,
        invoice.invoiceId,
        Number(StoreFees.REQUEST_PURCHASE),
        invoice.metadata,
        format
      );
    }

    if (!invoice.customer) {
      throw new Error("Customer address is required for jetton payment requests");
    }

    if (!isAddress(invoice.customer)) {
      throw new Error("Customer address is not a valid address");
    }

    const jettonWallet = this.tonClient.open(
      JettonWalletWrapper.createFromConfig(
        {
          balance: 0,
          masterAddress: invoice.currency.address,
          ownerAddress: invoice.customer,
          walletCode: invoice.currency.walletCode,
        },
        invoice.currency.walletCode
      )
    );

    return buildUserPaymentWithJettonsLink(
      this.wrapper.address.toString(),
      jettonWallet.address.toString(),
      invoice.currency.address,
      invoice.currency.walletCode,
      invoice.currency.decimals,
      invoice.amount,
      invoice.invoiceId,
      invoice.metadata,
      StoreFees.REQUEST_PURCHASE_JETTON,
      format
    )
  }

  async getPurchaseRequestInvoice(invoice: PurchaseRequestInvoice) {
    if (!invoice.invoiceId) {
      throw new Error("Invoice ID is required");
    }
  
    if (invoice.invoiceId.length > 120) {
      throw new Error("Invoice ID must not be longer than 120 characters");
    }
  
    if (invoice.metadata && invoice.metadata.length > 500) {
      throw new Error("Metadata must not be longer than 500 characters");
    }
  
    if (invoice.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const merchantAddress = await this.getOwner();

    return new Invoice(
      precalculateInvoiceAddress(
        this.wrapper.address.toString(),
        merchantAddress.toString(),
        false,
        ZERO_ADDRESS,
        invoice.invoiceId,
        invoice.metadata ?? "",
        invoice.amount * Math.pow(10, invoice.currency.decimals),
        true,
        invoice.currency.address,
        invoice.currency.walletCode
      ).toString(),
      this.tonClient,
      this.sender
    );
  }

  async applyUpdate(newStoreData: Cell | null) {
    if (!this.sender) {
      throw Error("This store is read-only. Pass the sender to the constructor to make changes.")
    }
    
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
    if (!this.sender) {
      throw Error("This store is read-only. Pass the sender to the constructor to make changes.")
    }
    
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
