import { ZERO_ADDRESS } from "@tonpay/core";
import { Cell } from "ton-core";
import { bridgeWallet, defaultWallet, boltWallet } from "./wallets";

export const Currencies = {
  TON: {
    name: "Toncoin",
    description: "Native Toncoin",
    symbol: "TON",
    decimals: 9,
    address: ZERO_ADDRESS,
    image: "https://avatars.githubusercontent.com/u/55018343?s=256",
    verified: true,
    walletCode: Cell.EMPTY.toBoc().toString("base64"),
  },
  jUSDT: {
    name: "jUSDT",
    description: "USDT transferred from Ethereum via bridge.ton.org.",
    symbol: "jUSDT",
    decimals: 6,
    address: "EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA",
    image:
      "https://bridge.ton.org/token/1/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
    walletCode: bridgeWallet,
    verified: true,
  },
  jUSDC: {
    name: "jUSDC",
    description: "USDC transferred from Ethereum via bridge.ton.org.",
    symbol: "jUSDC",
    decimals: 6,
    address: "EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728",
    image:
      "https://bridge.ton.org/token/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
    walletCode: bridgeWallet,
    verified: true,
  },
  oUSDT: {
    name: "Orbit Bridge Ton USD Tether",
    description: "Orbit Bridge Token on TON blockchain!",
    symbol: "oUSDT",
    decimals: 6,
    address: "EQC_1YoM8RBixN95lz7odcF3Vrkc_N8Ne7gQi7Abtlet_Efi",
    image:
      "https://raw.githubusercontent.com/orbit-chain/bridge-token-image/main/ton/usdt.png",
    walletCode: defaultWallet,
    verified: true,
  },
  oUSDC: {
    name: "Orbit Bridge Ton USD Coin",
    description: "Orbit Bridge Token on TON blockchain!",
    symbol: "oUSDC",
    decimals: 6,
    address: "EQC61IQRl0_la95t27xhIpjxZt32vl1QQVF2UgTNuvD18W-4",
    image:
      "https://raw.githubusercontent.com/orbit-chain/bridge-token-image/main/ton/usdt.png",
    walletCode: defaultWallet,
    verified: true,
  },
  jWBTC: {
    name: "jWBTC",
    description: "WBTC transferred from Ethereum via bridge.ton.org.",
    symbol: "jWBTC",
    decimals: 8,
    address: "EQDcBkGHmC4pTf34x3Gm05XvepO5w60DNxZ-XT4I6-UGG5L5",
    image:
      "https://bridge.ton.org/token/1/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
    walletCode: bridgeWallet,
    verified: true,
  },
  jDAI: {
    name: "jDAI",
    description: "DAI transferred from Ethereum via bridge.ton.org.",
    symbol: "jDAI",
    decimals: 18,
    address: "EQDo_ZJyQ_YqBzBwbVpMmhbhIddKtRP99HugZJ14aFscxi7B",
    image:
      "https://bridge.ton.org/token/1/0x6b175474e89094c44da98b954eedeac495271d0f.png",
    walletCode: bridgeWallet,
    verified: true,
  },
  oWBTC: {
    name: "Orbit Bridge Ton Wrapped BTC",
    description: "Orbit Bridge Token on TON blockchain!",
    symbol: "oWBTC",
    decimals: 8,
    address: "EQANasbzD5wdVx0qikebkchrH64zNgsB38oC9PVu7rG16qNB",
    image:
      "https://raw.githubusercontent.com/orbit-chain/bridge-token-image/main/ton/wbtc.png",
    walletCode: defaultWallet,
    verified: true,
  },
  oETH: {
    name: "Orbit Bridge Ton Ethereum",
    description: "Orbit Bridge Token on TON blockchain!",
    symbol: "oETH",
    decimals: 18,
    address: "EQAW42HutyDem98Be1f27PoXobghh81umTQ-cGgaKVmRLS7-",
    image:
      "https://raw.githubusercontent.com/orbit-chain/bridge-token-image/main/ton/eth.png",
    walletCode: defaultWallet,
    verified: true,
  },
  oDAI: {
    name: "Orbit Bridge Ton Dai",
    description: "Orbit Bridge Token on TON blockchain!",
    symbol: "oDAI",
    decimals: 18,
    address: "EQAAXwH0cajPsMF-nNC5kz-SaLaeaDr4M7Q1foVwP_vOW1tR",
    image:
      "https://raw.githubusercontent.com/orbit-chain/bridge-token-image/main/ton/dai.png",
    walletCode: defaultWallet,
    verified: true,
  },
  BOLT: {
    name: "Huebel Bolt",
    description: "Official token of the Huebel Company",
    symbol: "BOLT",
    decimals: 9,
    address: "EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw",
    image:
      "https://cloudflare-ipfs.com/ipfs/QmX47dodUg1acXoxYDULWTNfShXRW5uHrCmoKSUNR9xKQw",
    walletCode: boltWallet,
    verified: true,
  },
  SCALE: {
    name: "Scaleton",
    description:
      "SCALE is a utility token that will be used to support all independent developers.",
    symbol: "SCALE",
    decimals: 9,
    address: "EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE",
    image:
      "https://cloudflare-ipfs.com/ipfs/QmSMiXsZYMefwrTQ3P6HnDQaCpecS4EWLpgKK5EX1G8iA8",
    walletCode: defaultWallet,
    verified: true,
  },
  KINGY: {
    name: "Jetton kingy",
    description:
      "Jetton for the kingy community, united by the common idea of developing the TON ecosystem.",
    symbol: "KINGY",
    decimals: 9,
    address: "EQC-tdRjjoYMz3MXKW4pj95bNZgvRyWwZ23Jix3ph7guvHxJ",
    image: "https://i.ibb.co/FbTCKRP/logotokenkingy.png",
    walletCode: defaultWallet,
    verified: true,
  },
  PAY: {
    name: "Tonpay test token",
    description: "Test token for jetton integration into @TheTonpay",
    symbol: "PAY",
    decimals: 9,
    address: "EQAWROADS1e8nOgXmSjlSZS35kC5aWTvj8ukCj4ojrQqrr_a",
    image: "https://avatars.githubusercontent.com/u/122553410?s=256",
    walletCode: defaultWallet,
    verified: true,
    testnet: true,
  },
};
