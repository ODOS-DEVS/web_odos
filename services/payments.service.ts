import { ACCOUNT_ENDPOINTS, PAYMENTS_ENDPOINTS, WALLET_ENDPOINTS } from "@/libs/api-endpoint";
import type {
  AddressRead,
  CheckoutSessionCreate,
  CheckoutSessionRead,
  CustomerWalletRead,
  PaymentVerificationRead,
  WalletCheckoutCreate,
  WalletCheckoutRead,
} from "@/types/api";
import type { Order } from "@/types/order";
import { apiFetch } from "./http";
import { toOrder } from "./mappers";

export type { CheckoutSessionCreate, CheckoutSessionRead, WalletCheckoutCreate };

export type PaymentVerification = {
  reference: string;
  paid: boolean;
  /** The provider hasn't settled yet (e.g. a mobile-money prompt still waiting) — check again shortly. */
  pending: boolean;
  status: string;
  message: string;
  order: Order;
};

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  isDefault: boolean;
};

export const paymentsService = {
  /**
   * Creates the order and a hosted payment session in one call; redirect the shopper to
   * `authorization_url`, then verify the `reference` when they come back.
   *
   * Uses Kutanapay, the backend's live collections provider (`GET /health/payments` reports
   * `collections_provider: "kutanapay"`; Paystack is only configured in test mode there).
   */
  checkout: (input: CheckoutSessionCreate) =>
    apiFetch<CheckoutSessionRead>(PAYMENTS_ENDPOINTS.kutanapayCheckout, { method: "POST", body: input }),

  async verify(reference: string): Promise<PaymentVerification> {
    const result = await apiFetch<PaymentVerificationRead>(PAYMENTS_ENDPOINTS.verify(reference), { method: "POST" });
    // Free text on the wire, so match on stems.
    const text = `${result.payment_status} ${result.provider_status}`.toLowerCase();
    const failed = /unpaid|fail|declin|cancel|abandon|expire|reject/.test(text);
    const paid = !failed && /\bpaid\b|success|complete|captured/.test(text);
    return {
      reference: result.reference,
      paid,
      pending: !paid && !failed,
      status: result.payment_status,
      message: result.message,
      order: toOrder(result.order),
    };
  },

  /** The shopper's spendable ODOS Wallet balance. */
  async walletBalance(): Promise<number> {
    const wallet = await apiFetch<CustomerWalletRead>(WALLET_ENDPOINTS.wallet, { revalidate: false });
    return wallet.available_balance;
  },

  /** Places the order and pays it from the wallet in one step; no redirect. */
  async walletCheckout(input: WalletCheckoutCreate): Promise<{ order: Order; balanceAfter: number }> {
    const result = await apiFetch<WalletCheckoutRead>(WALLET_ENDPOINTS.checkout, { method: "POST", body: input });
    return { order: toOrder(result.order), balanceAfter: result.wallet_balance_after };
  },

  /** Saved delivery addresses on the account, default first — used to prefill checkout. */
  async addresses(): Promise<CheckoutAddress[]> {
    const rows = await apiFetch<AddressRead[]>(ACCOUNT_ENDPOINTS.addresses, { revalidate: false });
    return rows
      .map((a) => ({ fullName: a.full_name, phone: a.phone, street: a.street, city: a.city, region: a.region, isDefault: a.is_default }))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  },
};
