"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { vendorInventoryService, type InventoryStatus } from "@/services/vendor-inventory.service";
import { useVendorProfile, useVendorStore } from "./use-vendor";

const KEY = ["vendor", "inventory-v2"] as const;

/** The inventory endpoints need the vendor's store id: from the vendor profile, else from /vendor/store. */
export function useVendorStoreId() {
  const profile = useVendorProfile();
  const { store } = useVendorStore();
  const storeId = profile.data?.store_id || store?.id || null;
  return { storeId, isPending: !storeId && (profile.isPending || profile.isFetching) };
}

export function useInventoryStats() {
  const { storeId } = useVendorStoreId();
  return useQuery({
    queryKey: [...KEY, "stats", storeId],
    queryFn: () => vendorInventoryService.stats(storeId!),
    enabled: Boolean(storeId),
    staleTime: 20_000,
  });
}

export function useLowStockAlerts(threshold?: number) {
  const { storeId } = useVendorStoreId();
  return useQuery({
    queryKey: [...KEY, "low-stock", storeId, threshold],
    queryFn: () => vendorInventoryService.lowStock(storeId!, threshold),
    enabled: Boolean(storeId),
    staleTime: 20_000,
  });
}

/** Paged, server-filtered inventory list; search is debounced so typing doesn't fire a request per key. */
export function useInventoryList({ search, status, page, pageSize }: { search: string; status: InventoryStatus | ""; page: number; pageSize: number }) {
  const { storeId } = useVendorStoreId();
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: [...KEY, "list", storeId, debounced.trim(), status, page, pageSize],
    queryFn: () =>
      vendorInventoryService.list({ storeId: storeId!, search: debounced, status, skip: (page - 1) * pageSize, limit: pageSize }),
    enabled: Boolean(storeId),
    placeholderData: keepPreviousData,
  });
  return { ...query, searching: query.isPlaceholderData || debounced !== search };
}

export function useInventoryMovements(limit = 15) {
  const { storeId } = useVendorStoreId();
  return useQuery({
    queryKey: [...KEY, "movements", limit],
    queryFn: () => vendorInventoryService.movements(limit),
    enabled: Boolean(storeId),
  });
}

function useRefreshInventory() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: KEY });
    queryClient.invalidateQueries({ queryKey: ["vendor", "products"] });
    queryClient.invalidateQueries({ queryKey: ["vendor", "inventory"] });
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };
}

/** Saves a product's stock and/or price (PATCH …/stock, PATCH …/price) — only the fields that changed. */
export function useUpdateInventoryItem() {
  const refresh = useRefreshInventory();
  return useMutation({
    mutationFn: async (input: { productId: string; stock?: number; price?: number; oldPrice?: number | null }) => {
      if (input.stock !== undefined) await vendorInventoryService.setStock(input.productId, input.stock);
      if (input.price !== undefined) await vendorInventoryService.setPrice(input.productId, input.price, input.oldPrice);
    },
    onSettled: refresh,
  });
}

export function useBulkUpdateStock() {
  const { storeId } = useVendorStoreId();
  const refresh = useRefreshInventory();
  return useMutation({
    mutationFn: (updates: { productId: string; stock: number }[]) => {
      if (!storeId) throw new Error("Your store isn’t set up yet.");
      return vendorInventoryService.bulkUpdate(storeId, updates);
    },
    onSettled: refresh,
  });
}
