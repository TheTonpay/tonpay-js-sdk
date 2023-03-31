import {
  INVOICE_VERSION,
  InvoiceData,
  InvoiceWrapper,
  buildActivateInvoiceMessage,
  buildDeactivateInvoiceMessage,
  buildEditInvoiceMessage,
  buildMessageDeeplink,
  buildPayInvoiceMessage,
} from "@tonpay/core";
import { TonClient } from "ton";
import { Address, OpenedContract, Sender, toNano } from "ton-core";

export const InvoiceFees = {
  DEPLOY: toNano("0.005"),
  EDIT: toNano("0.005"),
  ACTIVATE: toNano("0.005"),
  DEACTIVATE: toNano("0.005"),
};

export class Invoice {
  private wrapper: InvoiceWrapper;
  private sender: Sender;
  private openedContract: OpenedContract<InvoiceWrapper>;
  private tonClient: TonClient;

  public constructor(address: string, sender: Sender, tonClient: TonClient) {
    this.wrapper = InvoiceWrapper.createFromAddress(Address.parse(address));
    this.sender = sender;
    this.tonClient = tonClient;
    this.openedContract = this.tonClient.open(this.wrapper);
  }

  async edit(
    hasCustomer: boolean,
    customer: string,
    invoiceId: string,
    amount: bigint
  ) {
    await this.openedContract.sendEditInvoice(this.sender, {
      value: InvoiceFees.EDIT,
      message: buildEditInvoiceMessage(
        hasCustomer,
        customer,
        invoiceId,
        amount
      ),
    });
  }

  async activate() {
    await this.openedContract.sendActivateInvoice(this.sender, {
      value: InvoiceFees.ACTIVATE,
      message: buildActivateInvoiceMessage(),
    });
  }

  async deactivate() {
    await this.openedContract.sendActivateInvoice(this.sender, {
      value: InvoiceFees.DEACTIVATE,
      message: buildDeactivateInvoiceMessage(),
    });
  }

  async pay(amount: number) {
    await this.openedContract.sendActivateInvoice(this.sender, {
      value: toNano(amount.toString()),
      message: buildDeactivateInvoiceMessage(),
    });
  }

  async getPaymentLink(): Promise<string> {
    const amount = await this.getAmount();
    return buildMessageDeeplink(
      this.wrapper.address,
      BigInt(amount),
      buildPayInvoiceMessage()
    );
  }

  async getStore(): Promise<Address> {
    return this.openedContract.getInvoiceStore();
  }

  async getMerchant(): Promise<Address> {
    return this.openedContract.getInvoiceMerchant();
  }

  async getCustomer(): Promise<Address> {
    return this.openedContract.getInvoiceCustomer();
  }

  async hasCustomer(): Promise<boolean> {
    return this.openedContract.getInvoiceHasCustomer();
  }

  async getInvoiceId(): Promise<string> {
    return this.openedContract.getInvoiceId();
  }

  async getAmount(): Promise<number> {
    return this.openedContract.getInvoiceAmount();
  }

  async isPaid(): Promise<boolean> {
    return this.openedContract.getInvoicePaid();
  }

  async isActive(): Promise<boolean> {
    return this.openedContract.getInvoiceActive();
  }

  async getVersion(): Promise<number> {
    return this.openedContract.getInvoiceVersion();
  }

  async getData(): Promise<InvoiceData> {
    return this.openedContract.getInvoiceData();
  }

  async shouldUpgrade(): Promise<boolean> {
    const version = await this.getVersion();
    return version < INVOICE_VERSION;
  }
}
