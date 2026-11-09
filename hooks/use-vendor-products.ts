"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorProductsService } from "@/services/vendor-products.service";
import type { VendorProduct, VendorProductInput } from "@/types/vendor";
import { useSession } from "./use-auth";

const KEY = ["vendor", "products"] as const;

/** The signed-in vendor's catalogue (GET /vendor/products). A 403 means the account isn't a vendor. */
export function useVendorProducts() {
  const session = useSession();
  return useQuery({ queryKey: KEY, queryFn: () => vendorProductsService.list(), enabled: Boolean(session) });
}

/** Writes update the cached list in place, then refetch so stock/availability stay exact. */
function useListUpdater() {
  const queryClient = useQueryClient();
  return {
    upsert: (product: VendorProduct) =>
      queryClient.setQueryData<VendorProduct[]>(KEY, (prev = []) =>
        prev.some((p) => p.id === product.id) ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev],
      ),
    remove: (id: string) => queryClient.setQueryData<VendorProduct[]>(KEY, (prev = []) => prev.filter((p) => p.id !== id)),
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      // The shop pages show vendor products too.
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  };
}

export function useSaveVendorProduct() {
  const list = useListUpdater();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: VendorProductInput }) =>
      id ? vendorProductsService.update(id, input) : vendorProductsService.create(input),
    onSuccess: (product) => {
      list.upsert(product);
      list.refresh();
    },
  });
}

export function useDeleteVendorProduct() {
  const list = useListUpdater();
  return useMutation({
    mutationFn: (id: string) => vendorProductsService.remove(id),
    onSuccess: (_result, id) => {
      list.remove(id);
      list.refresh();
    },
  });
}
