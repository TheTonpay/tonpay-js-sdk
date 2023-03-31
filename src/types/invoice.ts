export type InvoiceInfo = {
  hasCustomer: boolean;
  customer: string;
  invoiceId: string;
  amount: number;
};

export type PurchaseRequestInvoice = {
  invoiceId: string;
  amount: number;
};
