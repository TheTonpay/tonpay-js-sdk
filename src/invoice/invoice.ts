import {
  DeeplinkFormat,
  INVOICE_VERSION,
  InvoiceData,
  InvoiceWrapper,
  JettonWalletWrapper,
  buildActivateInvoiceMessage,
  buildDeactivateInvoiceMessage,
  buildEditInvoiceMessage,
  buildMessageDeeplink,
  buildPayInvoiceMessage,
  buildPayInvoiceWithJettonsMessage,
  isAddress,
} from "@tonpay/core";
import { TonClient } from "ton";
import { Address, Cell, OpenedContract, Sender, toNano } from "ton-core";
import { Currency } from "../types/currency";
import { Currencies } from "../currency/currencies";

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
   *   6.9,
   *   Currencies.jUSDT
   * );
   * ```
   */
  async edit(
    hasCustomer: boolean,
    customer: string,
    invoiceId: string,
    metadata: string,
    amount: number,
    currency: Currency
  ) {
    await this.openedContract.sendEditInvoice(this.sender, {
      value: InvoiceFees.EDIT,
      message: buildEditInvoiceMessage(
        hasCustomer,
        customer,
        invoiceId,
        metadata,
        BigInt(amount * Math.pow(10, currency.decimals)),
        currency !== Currencies.TON,
        currency.address,
        currency.walletCode
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
   * @param {number} amount - Amount in TON, not nanoTON
   * @param {string} customerAddress - Address of the customer that will pay the invoice. Required if currency is not TON and invoice has no assigned customer
   * @param {Currency} currency - Currency to pay with. Default is TON
   *
   * @example
   * ```typescript
   * await invoice.pay(6.9);
   * ```
   *
   * @example
   * ```typescript
   * await invoice.pay(6.9, "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N", Currencies.jUSDT);
   * ```
   */
  async pay(
    amount: number,
    customerAddress?: string,
    currency: Currency = Currencies.TON
  ) {
    if (!Object.values(Currencies).includes(currency)) {
      throw new Error("Currency is not supported");
    }

    if (currency == Currencies.TON) {
      await this.openedContract.sendPayInvoice(this.sender, {
        value: toNano(amount.toString()),
        message: buildPayInvoiceMessage(),
      });
      return;
    }

    const ownData = await this.getData();

    if (!ownData.hasCustomer) {
      if (!customerAddress) {
        throw new Error("Customer address is required");
      }

      if (!isAddress(customerAddress)) {
        throw new Error("Customer address is not a TON address");
      }
    }

    const userAddress = customerAddress || ownData.customer;

    const jettonWallet = this.tonClient.open(
      JettonWalletWrapper.createFromConfig(
        {
          balance: 0,
          masterAddress: currency.address,
          ownerAddress: userAddress,
          walletCode: currency.walletCode,
        },
        currency.walletCode
      )
    );
    await jettonWallet.sendJettons(this.sender, {
      value: toNano(amount.toString()),
      message: buildPayInvoiceWithJettonsMessage(
        BigInt(`${amount}`),
        this.address
      ),
    });
  }

  /**
   * @description This method returns the payment link for the user in the specified format. Only for TON currency
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
  async getPaymentLink(format: DeeplinkFormat = "ton"): Promise<string> {
    const invoiceData = await this.getData();

    if (invoiceData.acceptsJetton) {
      throw new Error("Payment link is not available for jetton invoices");
    }

    return buildMessageDeeplink(
      this.wrapper.address,
      BigInt(invoiceData.amount),
      buildPayInvoiceMessage(),
      format
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

  async acceptsJetton(): Promise<boolean> {
    return this.openedContract.getInvoiceAcceptsJetton();
  }

  async getJettonMasterAddress(): Promise<Address> {
    return this.openedContract.getInvoiceJettonMasterAddress();
  }

  async getJettonWalletCode(): Promise<Cell> {
    return this.openedContract.getInvoiceJettonWalletCode();
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
