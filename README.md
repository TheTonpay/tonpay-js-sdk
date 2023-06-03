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

## Full documentation

Full documentation for this SDK is available on [GitBook](https://tonpay.gitbook.io/tonpay-sdk/).


## Example usage

```ts
import { Tonpay } from "@tonpay/sdk";

// implement a Sender interface from 'ton' library or use @tonpay/react package for useSender() hook
// hint: you don't need sender if you don't plan to interact with the TON Blockchain (i.e. if you only want to generate payment links or fetch info)
const sender = buildSender();

// create Tonpay instance
const tonpay = Tonpay.create("testnet", sender);

// get your interactive store by address
const store = tonpay.getStore(
  "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"
);

// get a payment link and provide it in any form (button, QR code) to the customer
const paymentLink = await store.getRequestPurchaseLink({
  invoiceId: "test_invoice_id",
  amount: 5
}, "tonkeeper");

// or initiate a purchase request and get the invoice address even before it's created on-chain
const invoice = await store.requestPurchase({
  invoiceId: "test_invoice_id",
  amount: 5 // TON
});

// now you can monitor invoice status manually
const isPaid = await invoice.isPaid();

// or redirect to hosted checkout page that'll display the payment state automatically

const hostedCheckoutUrl = `https://pay.thetonpay.app/i/${invoice.address}`;
window.location.href = hostedCheckoutUrl;
```

Demo store that uses this SDK can be found [here](https://github.com/TheTonpay/Durger-King-2.0).

Contact [@Arterialist](https://t.me/arterialist) if you have questions and open issues on github, if there are any.
