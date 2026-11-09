import { ACCOUNT_ENDPOINTS } from "@/libs/api-endpoint";
import type { AddressRead } from "@/types/api";
import type { SavedAddress } from "@/hooks/use-addresses";
import { apiFetch } from "./http";

export const toSavedAddress = (a: AddressRead): SavedAddress => ({
  id: a.id,
  label: a.label || "Address",
  fullName: a.full_name,
  phone: a.phone,
  street: a.street,
  city: a.city,
  region: a.region,
  isDefault: Boolean(a.is_default),
});

export const addressesService = {
  async list(): Promise<SavedAddress[]> {
    const rows = await apiFetch<AddressRead[]>(ACCOUNT_ENDPOINTS.addresses, { revalidate: false });
    return rows.map(toSavedAddress).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  },

  async create(draft: Omit<SavedAddress, "id">): Promise<SavedAddress> {
    const created = await apiFetch<AddressRead>(ACCOUNT_ENDPOINTS.addresses, {
      method: "POST",
      body: {
        label: draft.label,
        full_name: draft.fullName,
        phone: draft.phone,
        street: draft.street,
        city: draft.city,
        region: draft.region,
        is_default: draft.isDefault,
      },
    });
    return toSavedAddress(created);
  },

  async update(id: string, draft: Partial<SavedAddress>): Promise<SavedAddress> {
    const updated = await apiFetch<AddressRead>(ACCOUNT_ENDPOINTS.address(id), {
      method: "PATCH",
      body: {
        label: draft.label,
        full_name: draft.fullName,
        phone: draft.phone,
        street: draft.street,
        city: draft.city,
        region: draft.region,
        is_default: draft.isDefault,
      },
    });
    return toSavedAddress(updated);
  },

  delete(id: string): Promise<unknown> {
    return apiFetch<unknown>(ACCOUNT_ENDPOINTS.address(id), { method: "DELETE" });
  },

  async setDefault(id: string): Promise<SavedAddress> {
    const updated = await apiFetch<AddressRead>(ACCOUNT_ENDPOINTS.addressDefault(id), { method: "POST" });
    return toSavedAddress(updated);
  },
};

