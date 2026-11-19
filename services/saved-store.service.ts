import { SAVED_STORE_ENDPOINTS } from "@/libs/api-endpoint";
import { apiFetch } from "./http";
import { toStore } from "./mappers";
import type { SavedStoreRead } from "@/types/api";
import type { SavedStore } from "@/types/catalog";

const toSavedStore = (row: SavedStoreRead): SavedStore => ({
  store: toStore(row.store),
  savedAt: row.saved_at,
});

/**
 * Stores the signed-in shopper kept.
 *
 * Server-backed rather than localStorage: a save has to survive logout and follow the shopper
 * to another device. Every call is scoped to the token — no store list or user id is sent, so
 * there is nothing a browser could change to read someone else's saves.
 */
export const savedStoreService = {
  async list(): Promise<SavedStore[]> {
    const rows = await apiFetch<SavedStoreRead[]>(SAVED_STORE_ENDPOINTS.list, { revalidate: false });
    return rows.map(toSavedStore);
  },

  /** Idempotent on the server: saving an already-saved store returns the existing save. */
  async save(storeId: string): Promise<SavedStore> {
    return toSavedStore(
      await apiFetch<SavedStoreRead>(SAVED_STORE_ENDPOINTS.one(storeId), { method: "POST" }),
    );
  },

  /** Removing something not saved succeeds — the end state is the same either way. */
  async remove(storeId: string): Promise<void> {
    await apiFetch<void>(SAVED_STORE_ENDPOINTS.one(storeId), { method: "DELETE" });
  },
};
