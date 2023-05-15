import { Currency } from "./currency";

export type InvoiceInfo = {
  hasCustomer: boolean;
  customer: string;
  invoiceId: string;
  metadata: string;
  amount: number;
  currency: Currency;
};

export type PurchaseRequestInvoice = {
  invoiceId: string;
  metadata: string;
  amount: number;
  currency: Currency;
  customer?: string;
};
