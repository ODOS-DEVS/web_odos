/** A movement on the shopper's ODOS Wallet. `kind` is free text on the wire ("topup", "spend", "refund"…). */
export type WalletTransaction = {
  id: string;
  kind: string;
  title: string;
  /** Signed by the backend: positive for credits, negative for spend. */
  amount: number;
  balanceAfter: number;
  orderId: string | null;
  createdAt: string;
};

export type Wallet = {
  id: string;
  currency: string;
  balance: number;
  lifetimeTopups: number;
  lifetimeSpend: number;
  lifetimeRefunds: number;
  transactions: WalletTransaction[];
};

/** The hosted top-up session to redirect to, mirroring the checkout flow. */
export type WalletTopUpSession = {
  reference: string;
  authorizationUrl: string;
  amount: number;
  currency: string;
  status: string;
};
