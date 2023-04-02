# Tonpay JavaScript SDK

JavaScript SDK for Tonpay

## Installation

```bash
npm install @tonpay/sdk
```

or with yarn

```bash
yarn add @tonpay/sdk
```

## Usage

```ts
import { Tonpay } from "@tonpay/sdk";

// implement a Sender interface from 'ton' library or use @tonpay/react package for useSender() hook
const sender = buildSender();

// create Tonpay instance
const tonpay = Tonpay.create("testnet", sender);

// get your interactive store by address
const store = Tonpay.getStore(
  "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"
);

// get a payment link and provide it in any form (button, QR code) to the customer
const paymentLink = await store.getRequestPurchaseLink({
  "test_invoice_id",
  5 // TON
}, "tonkeeper");

// or initiate a purchase request and get the invoice address even before it's created on-chain
const invoiceAddress = await store.requestPurchase({
  "test_invoice_id",
  5 // TON
});

// now you can monitor invoice status manually
const invoice = tonpay.getInvoice(invoiceAddress);
const isPaid = await invoice.isPaid();

// or redirect to hosted checkout page that'll display the payment statue automatically

const hostedCheckoutUrl = `https://pay.thetonpay.app/i/${invoiceAddress}`;
window.location.href = hostedCheckoutUrl;
```

Demo store that uses this SDK can be found [here](https://github.com/TheTonpay/Durger-King-2.0).

Contact [@Arterialist](https://t.me/arterialist) if you have questions and open issues on github, if there are any.
