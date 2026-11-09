import { ACCOUNT_ENDPOINTS } from "@/libs/api-endpoint";
import type { AddressCreate, AddressRead } from "@/types/api";
import type { SavedAddress, SavedPaymentMethod } from "@/types/account";
import { apiFetch } from "./http";

/** The API's `label` is optional; the UI always shows something, so fall back to the city. */
function toAddress(a: AddressRead): SavedAddress {
  return {
    id: a.id,
    label: a.label?.trim() || a.city,
    fullName: a.full_name,
    phone: a.phone,
    street: a.street,
    city: a.city,
    region: a.region,
    gpsCode: a.gps_code ?? null,
    isDefault: a.is_default,
  };
}

/** What a form supplies: the GPS code and the default flag are both optional on the way in. */
export type AddressInput = Omit<SavedAddress, "id" | "gpsCode" | "isDefault"> & {
  gpsCode?: string | null;
  isDefault?: boolean;
};

function toPayload(input: AddressInput): AddressCreate {
  return {
    label: input.label || null,
    full_name: input.fullName,
    phone: input.phone,
    street: input.street,
    city: input.city,
    region: input.region,
    gps_code: input.gpsCode || null,
    is_default: input.isDefault ?? false,
  };
}

type PaymentMethodRead = {
  id: string;
  type: "card" | "momo";
  label: string;
  is_default: boolean;
  card_name?: string | null;
  card_last4?: string | null;
  expiry?: string | null;
  network?: string | null;
  phone?: string | null;
};

function toPaymentMethod(p: PaymentMethodRead): SavedPaymentMethod {
  return {
    id: p.id,
    kind: p.type,
    label: p.label,
    isDefault: p.is_default,
    network: p.network ?? null,
    phone: p.phone ?? null,
    cardName: p.card_name ?? null,
    cardLast4: p.card_last4 ?? null,
    expiry: p.expiry ?? null,
  };
}

/**
 * What the form supplies. There is deliberately no full card number and no CVV: the backend stores
 * only `card_last4` ("the app never transmits a full PAN"), so neither is sent, and a CVV has no
 * use in a saved reference.
 */
export type PaymentMethodInput = {
  type: "card" | "momo";
  label?: string | null;
  isDefault?: boolean;
  network?: "MTN" | "Telecel" | "AT" | null;
  phone?: string | null;
  cardName?: string | null;
  cardLast4?: string | null;
  expiry?: string | null;
};

export const accountService = {
  async addresses(): Promise<SavedAddress[]> {
    const rows = await apiFetch<AddressRead[]>(ACCOUNT_ENDPOINTS.addresses, { revalidate: false });
    // Default first, so the checkout form can take `[0]` without sorting again.
    return rows.map(toAddress).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  },

  async createAddress(input: AddressInput): Promise<SavedAddress> {
    return toAddress(await apiFetch<AddressRead>(ACCOUNT_ENDPOINTS.addresses, { method: "POST", body: toPayload(input) }));
  },

  async updateAddress(id: string, input: AddressInput): Promise<SavedAddress> {
    return toAddress(await apiFetch<AddressRead>(ACCOUNT_ENDPOINTS.address(id), { method: "PATCH", body: toPayload(input) }));
  },

  deleteAddress: (id: string) => apiFetch<unknown>(ACCOUNT_ENDPOINTS.address(id), { method: "DELETE" }),

  async setDefaultAddress(id: string): Promise<SavedAddress> {
    return toAddress(await apiFetch<AddressRead>(ACCOUNT_ENDPOINTS.addressDefault(id), { method: "POST" }));
  },

  /* ---------- Payment methods ---------- */

  async paymentMethods(): Promise<SavedPaymentMethod[]> {
    const rows = await apiFetch<PaymentMethodRead[]>(ACCOUNT_ENDPOINTS.paymentMethods, { revalidate: false });
    return rows.map(toPaymentMethod).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  },

  createPaymentMethod: (input: PaymentMethodInput) =>
    apiFetch<PaymentMethodRead>(ACCOUNT_ENDPOINTS.paymentMethods, {
      method: "POST",
      body: {
        type: input.type,
        label: input.label || null,
        is_default: input.isDefault ?? false,
        network: input.network ?? null,
        phone: input.phone || null,
        card_name: input.cardName || null,
        card_last4: input.cardLast4 || null,
        expiry: input.expiry || null,
      },
    }),

  deletePaymentMethod: (id: string) => apiFetch<unknown>(ACCOUNT_ENDPOINTS.paymentMethod(id), { method: "DELETE" }),

  async setDefaultPaymentMethod(id: string): Promise<SavedPaymentMethod> {
    return toPaymentMethod(await apiFetch<PaymentMethodRead>(ACCOUNT_ENDPOINTS.paymentMethodDefault(id), { method: "POST" }));
  },
};
