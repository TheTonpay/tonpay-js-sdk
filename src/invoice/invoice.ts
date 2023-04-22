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

  public address: string;

  public constructor(address: string, sender: Sender, tonClient: TonClient) {
    this.wrapper = InvoiceWrapper.createFromAddress(Address.parse(address));
    this.address = address;
    this.sender = sender;
    this.tonClient = tonClient;
    this.openedContract = this.tonClient.open(this.wrapper);
  }

  /**
   * @description This method edits the invoice data
   *
   * @param hasCustomer - If the invoice has a customer
   * @param customer - New customer address or ZERO_ADDRESS if hasCustomer is false
   * @param invoiceId - New invoice ID
   * @param metadata - New invoice metadata
   * @param amount - New invoice amount in TON, not nanoTON!
   *
   * @example
   * ```typescript
   * await invoice.edit(
   *   true,
   *   "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N",
   *   "in_abcderf654321",
   *   "some metadata",
   *   6.9
   * );
   * ```
   */
  async edit(
    hasCustomer: boolean,
    customer: string,
    invoiceId: string,
    metadata: string,
    amount: bigint
  ) {
    await this.openedContract.sendEditInvoice(this.sender, {
      value: InvoiceFees.EDIT,
      message: buildEditInvoiceMessage(
        hasCustomer,
        customer,
        invoiceId,
        metadata,
        amount
      ),
    });
  }

  /**
   * @description This method activates the invoice
   *
   * @example
   * ```typescript
   * await invoice.activate();
   * ```
   */
  async activate() {
    await this.openedContract.sendActivateInvoice(this.sender, {
      value: InvoiceFees.ACTIVATE,
      message: buildActivateInvoiceMessage(),
    });
  }

  /**
   * @description This method deactivates the invoice
   *
   * @example
   * ```typescript
   * await invoice.deactivate();
   * ```
   */
  async deactivate() {
    await this.openedContract.sendActivateInvoice(this.sender, {
      value: InvoiceFees.DEACTIVATE,
      message: buildDeactivateInvoiceMessage(),
    });
  }

  /**
   * @description This method pays the invoice
   *
   * @param amount - Amount in TON, not nanoTON!
   *
   * @example
   * ```typescript
   * await invoice.pay(6.9);
   * ```
   */
  async pay(amount: number) {
    await this.openedContract.sendActivateInvoice(this.sender, {
      value: toNano(amount.toString()),
      message: buildDeactivateInvoiceMessage(),
    });
  }

  /**
   * @description This method returns the payment link for the user in the specified format
   *
   * @param format - the deeplink format: "ton" (default) or "tonkeeper"
   *
   * @returns payment link in the specified format
   *
   * @example
   * ```typescript
   * const link = await invoice.getPaymentLink("tonkeeper");
   * ```
   */
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

  async getMetadata(): Promise<string> {
    return this.openedContract.getInvoiceMetadata();
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

  async getData(version: number = INVOICE_VERSION): Promise<InvoiceData> {
    return this.openedContract.getInvoiceData(version);
  }

  async shouldUpgrade(): Promise<boolean> {
    const version = await this.getVersion();
    return version < INVOICE_VERSION;
  }
}
