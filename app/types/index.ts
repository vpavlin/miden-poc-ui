export type Tab = "send" | "addressbook" | "notes" | "faucet";

export type Faucet = {
  id: string;
  symbol: string;
  decimals: number;
  maxSupply: string;
};

export type Contact = {
  name: string;
  address: string;
  publicKey: string;
};

export type Recipient = {
  address: string;
  amount: string;
  publicKey: string;
};

export type Account = {
  id: string;
  name: string;
  isPublic: boolean;
};
