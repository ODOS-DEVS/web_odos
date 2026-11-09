/* eslint-disable @typescript-eslint/no-explicit-any -- these endpoints return untyped JSON, so they're read defensively */
import { PAYMENT_METHODS_ENDPOINTS, PAYMENTS_ENDPOINTS } from "@/libs/api-endpoint";
import type { CheckoutSessionCreate, CheckoutSessionRead } from "@/types/api";
import { apiFetch } from "./http";

export type DirectPayMethod = {
  /** What `provider` must be when initiating. */
  provider: string;
  label: string;
  /** Mobile money needs a phone number to send the prompt to. */
  needsPhone: boolean;
  enabled: boolean;
};

export type DirectPayResult = {
  status: string;
  paid: boolean;
  failed: boolean;
  message: string | null;
  reference: string | null;
  /** Some providers hand back a hosted page instead of a phone prompt. */
  redirectUrl: string | null;
};

const LABELS: Record<string, string> = {
  mtn: "MTN MoMo",
  mtn_momo: "MTN MoMo",
  vodafone: "Telecel Cash",
  telecel: "Telecel Cash",
  airteltigo: "AT Money",
  at: "AT Money",
  card: "Card",
  paystack: "Paystack",
  kutanapay: "Kutanapay",
  wallet: "ODOS Wallet",
};

const labelFor = (provider: string, raw?: any) =>
  raw?.label ?? raw?.name ?? raw?.display_name ?? LABELS[provider.toLowerCase()] ?? provider.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function toMethods(res: any): DirectPayMethod[] {
  const list: any[] = Array.isArray(res)
    ? res
    : Array.isArray(res?.methods)
      ? res.methods
      : Array.isArray(res?.payment_methods)
        ? res.payment_methods
        : Array.isArray(res?.providers)
          ? res.providers
          : Array.isArray(res?.items)
            ? res.items
            : res && typeof res === "object"
              ? // { mtn: true, card: false } or { mtn: {...} }
                Object.entries(res).map(([key, value]) => (typeof value === "object" && value ? { provider: key, ...(value as object) } : { provider: key, enabled: Boolean(value) }))
              : [];

  return list
    .map((raw) => {
      const provider = String(typeof raw === "string" ? raw : (raw.provider ?? raw.code ?? raw.id ?? raw.key ?? raw.type ?? "")).trim();
      const type = String(typeof raw === "string" ? raw : (raw.type ?? raw.category ?? provider)).toLowerCase();
      return {
        provider,
        label: labelFor(provider, typeof raw === "string" ? undefined : raw),
        needsPhone: /momo|mobile|mtn|telecel|vodafone|airtel|\bat\b/.test(`${type} ${provider.toLowerCase()}`) || Boolean(raw?.requires_phone),
        enabled: typeof raw === "string" ? true : raw.enabled !== false && raw.available !== false && raw.is_active !== false,
      };
    })
    .filter((m) => m.provider && m.enabled);
}

function toResult(res: any): DirectPayResult {
  const status = String(res?.payment_status ?? res?.status ?? res?.provider_status ?? "pending");
  const text = `${status} ${res?.provider_status ?? ""}`.toLowerCase();
  const failed = /unpaid|fail|declin|cancel|abandon|expire|reject|error/.test(text);
  const paid = !failed && (/\bpaid\b|success|complete|captured|approved/.test(text) || res?.paid === true);
  return {
    status,
    paid,
    failed,
    message: res?.message ?? res?.detail ?? null,
    reference: res?.provider_reference ?? res?.reference ?? res?.transaction_id ?? null,
    redirectUrl: res?.authorization_url ?? res?.checkout_url ?? res?.redirect_url ?? res?.payment_url ?? null,
  };
}

/** Paying an existing order directly (login required): list providers → initiate → verify. */
export const directPayService = {
  async available(): Promise<DirectPayMethod[]> {
    return toMethods(await apiFetch<any>(PAYMENT_METHODS_ENDPOINTS.available, { revalidate: false }));
  },

  async initiate(orderId: string, provider: string, phone?: string | null): Promise<DirectPayResult> {
    const res = await apiFetch<any>(PAYMENT_METHODS_ENDPOINTS.initiate, {
      method: "POST",
      query: { order_id: orderId, provider, phone_number: phone?.trim() || undefined },
    });
    return toResult(res);
  },

  async verify(orderId: string, provider: string, providerReference?: string | null): Promise<DirectPayResult> {
    const res = await apiFetch<any>(PAYMENT_METHODS_ENDPOINTS.verify, {
      method: "POST",
      query: { order_id: orderId, provider, provider_reference: providerReference || undefined },
    });
    return toResult(res);
  },

  /**
   * The generic hosted checkout (POST /payments/checkout — Paystack). The storefront uses the Kutanapay
   * checkout for live payments; this is here for test-mode or a provider switch.
   */
  genericCheckout: (input: CheckoutSessionCreate) =>
    apiFetch<CheckoutSessionRead>(PAYMENTS_ENDPOINTS.checkout, { method: "POST", body: input }),
};
