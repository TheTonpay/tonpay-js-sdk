export type InvoiceInfo = {
  hasCustomer: boolean;
  customer: string;
  invoiceId: string;
  metadata: string;
  amount: number;
};

export type PurchaseRequestInvoice = {
  invoiceId: string;
  metadata: string;
  amount: number;
};
