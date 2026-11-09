import { ACCOUNT_ENDPOINTS } from "@/libs/api-endpoint";
import type { AddressCreate, AddressRead } from "@/types/api";
import type { SavedAddress } from "@/types/account";
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
};
