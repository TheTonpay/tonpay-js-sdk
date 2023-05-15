import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonNetwork } from "@tonpay/core";
import { Sender, TonClient } from "ton";
import { Store } from "./store/store";
import { Invoice } from "./invoice/invoice";

export * from "./store/store";
export * from "./invoice/invoice";
export * from "./types/invoice";
export * from "./types/currency";
export * from "./currency/currencies";
export * from "./currency/wallets";

export class Tonpay {
  private tonClient: TonClient;
  private sender: Sender;

  private constructor(tonClient: TonClient, sender: Sender) {
    this.tonClient = tonClient;
    this.sender = sender;
  }

  public static async create(network: TonNetwork, sender: Sender) {
    const endpoint = await getHttpEndpoint({ network: network });
    const tonClient = new TonClient({ endpoint });
    return new Tonpay(tonClient, sender);
  }

  public getStore(address: string) {
    return new Store(address, this.sender, this.tonClient);
  }

  public getInvoice(address: string) {
    return new Invoice(address, this.sender, this.tonClient);
  }
}
