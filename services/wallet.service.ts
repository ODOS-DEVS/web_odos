import { WALLET_ENDPOINTS } from "@/libs/api-endpoint";
import type {
  CustomerWalletRead,
  WalletTopupSessionCreate,
  WalletTopupSessionRead,
} from "@/types/api";
import { apiFetch } from "./http";

export const walletService = {
  /** Retrieves the shopper's wallet balance, currency, and recent transactions. */
  get: () => apiFetch<CustomerWalletRead>(WALLET_ENDPOINTS.wallet, { revalidate: false }),

  /** Initiates a wallet top-up payment session with payment provider. */
  topupCheckout: (input: WalletTopupSessionCreate) =>
    apiFetch<WalletTopupSessionRead>(WALLET_ENDPOINTS.topupCheckout, {
      method: "POST",
      body: input,
    }),

  /** Verifies a wallet top-up payment once the customer completes authorization. */
  topupVerify: (reference: string) =>
    apiFetch<CustomerWalletRead>(WALLET_ENDPOINTS.topupVerify(reference), {
      method: "POST",
    }),
};

