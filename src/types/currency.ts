export type Currency = {
  name: string;
  description: string;
  symbol: string;
  decimals: number;
  address: string;
  image: string;
  walletCode: string;
  verified: boolean;
  testnet?: boolean;
};
