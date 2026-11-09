import { WALLET_ENDPOINTS } from "@/libs/api-endpoint";
import type { Wallet, WalletTopUpSession, WalletTransaction } from "@/types/wallet";
import { apiFetch } from "./http";

type CustomerWalletTransactionRead = {
  id: string;
  kind: string;
  title: string;
  amount: number;
  balance_after: number;
  order_id?: string | null;
  created_at: string;
};

type CustomerWalletRead = {
  id: string;
  currency: string;
  available_balance: number;
  lifetime_topups: number;
  lifetime_spend: number;
  lifetime_refunds: number;
  recent_transactions?: CustomerWalletTransactionRead[] | null;
};

type CustomerWalletTopUpSessionRead = {
  reference: string;
  authorization_url: string;
  amount: number;
  currency: string;
  status: string;
};

export type WalletTopUpInput = {
  amount: number;
  payment_type?: string | null;
  payment_label?: string | null;
  callback_url?: string | null;
  cancel_url?: string | null;
};

function toTransaction(t: CustomerWalletTransactionRead): WalletTransaction {
  return {
    id: t.id,
    kind: t.kind,
    title: t.title,
    amount: t.amount,
    balanceAfter: t.balance_after,
    orderId: t.order_id ?? null,
    createdAt: t.created_at,
  };
}

function toWallet(w: CustomerWalletRead): Wallet {
  return {
    id: w.id,
    currency: w.currency,
    balance: w.available_balance,
    lifetimeTopups: w.lifetime_topups,
    lifetimeSpend: w.lifetime_spend,
    lifetimeRefunds: w.lifetime_refunds,
    transactions: (w.recent_transactions ?? []).map(toTransaction),
  };
}

export const walletService = {
  /** Never cached: a balance the shopper is about to spend has to be current. */
  async get(): Promise<Wallet> {
    return toWallet(await apiFetch<CustomerWalletRead>(WALLET_ENDPOINTS.wallet, { revalidate: false }));
  },

  /**
   * Starts a top-up. Money only reaches the wallet once the provider confirms it, so this returns a
   * hosted payment URL to redirect to — exactly like checkout — rather than crediting anything.
   */
  async topUp(input: WalletTopUpInput): Promise<WalletTopUpSession> {
    const session = await apiFetch<CustomerWalletTopUpSessionRead>(WALLET_ENDPOINTS.topupCheckout, {
      method: "POST",
      body: input,
    });
    return {
      reference: session.reference,
      authorizationUrl: session.authorization_url,
      amount: session.amount,
      currency: session.currency,
      status: session.status,
    };
  },

  /** Confirms a top-up when the shopper comes back from the provider. */
  verifyTopUp: (reference: string) =>
    apiFetch<{ reference: string; status: string; message: string; amount: number }>(
      WALLET_ENDPOINTS.topupVerify(reference),
      { method: "POST" },
    ),
};
