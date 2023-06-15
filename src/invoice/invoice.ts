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
  buildStorePaymentLink,
  buildStorePaymentWithJettonsLink,
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
  PAY_WITH_JETTONS: toNano("0.6"),
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
   * @param currency - New invoice currency
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
   * @param {string} customerAddress - Address of the customer that will pay the invoice. Required if currency is not TON and invoice has no assigned customer
   *
   * @example
   * ```typescript
   * await invoice.pay();
   * ```
   *
   * @example
   * ```typescript
   * // invoice with token currency and no customer
   * await invoice.pay("EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N");
   * ```
   */
  async pay(customerAddress?: string) {
    const invoiceData = await this.getData();

    const currency =
      Currencies[
        (Object.keys(Currencies).find(
          (c) =>
            Currencies[c as keyof typeof Currencies].address ===
            invoiceData.jettonMasterAddress
        ) as keyof typeof Currencies) || "TON"
      ];

    if (currency == Currencies.TON) {
      await this.openedContract.sendPayInvoice(this.sender, {
        value: BigInt(invoiceData.amount),
        message: buildPayInvoiceMessage(),
      });
      return;
    }

    if (!invoiceData.hasCustomer) {
      if (!customerAddress) {
        throw new Error("Customer address is required");
      }

      if (!isAddress(customerAddress)) {
        throw new Error("Customer address is not a TON address");
      }
    }

    const userAddress = customerAddress || invoiceData.customer;

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
      value: InvoiceFees.PAY_WITH_JETTONS,
      message: buildPayInvoiceWithJettonsMessage(
        BigInt(invoiceData.amount),
        this.address
      ),
    });
  }

  /**
   * @description This method returns the payment link for the user in the specified format
   *
   * @param format - the deeplink format: "ton" (default) or "tonkeeper"
   * @param customer - the customer address. Required if currency is not TON and invoice has no assigned customer
   *
   * @returns payment link in the specified format
   *
   * @example
   * ```typescript
   * const link = await invoice.getPaymentLink("tonkeeper");
   * ```
   */
  async getPaymentLink(customer?: string, format: DeeplinkFormat = "ton"): Promise<string> {
    const invoiceData = await this.getData();
    const currency = await this.getCurrency(invoiceData);

    if (currency == Currencies.TON) {
      return buildStorePaymentLink(
        this.wrapper.address.toString(),
        invoiceData.amount,
        format
      )
    }

    if (!invoiceData.hasCustomer) {
      if (!customer) {
        throw new Error("Customer address is required");
      }

      if (!isAddress(customer)) {
        throw new Error("Customer address is not a TON address");
      }
    }

    const userAddress = customer || invoiceData.customer;

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

    return buildStorePaymentWithJettonsLink(
      this.wrapper.address.toString(),
      Number(InvoiceFees.PAY_WITH_JETTONS),
      invoiceData.amount,
      jettonWallet.address.toString(),
      format
    )
  }

  async getCurrency(invoiceData: InvoiceData | null): Promise<Currency> {
    if (!invoiceData) invoiceData = await this.getData();

    return Currencies[
      (Object.keys(Currencies).find(
        (c) =>
          Currencies[c as keyof typeof Currencies].address ===
          invoiceData!.jettonMasterAddress
      ) as keyof typeof Currencies) || "TON"
    ];
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
