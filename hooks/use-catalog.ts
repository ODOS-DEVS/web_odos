"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProductListParams, StoreListParams } from "@/services/catalog.service";
import { catalogQueries, reviewQueries } from "@/services/queries";
import type { Store } from "@/types/catalog";

export const useCategories = () => useQuery(catalogQueries.categories());

export const useStores = (params: StoreListParams = {}) => useQuery(catalogQueries.stores(params));

export const useStoreSections = (storeId: string | undefined) =>
  useQuery({ ...catalogQueries.storeSections(storeId ?? ""), enabled: Boolean(storeId) });

export const useProducts = (params: ProductListParams = {}) => useQuery(catalogQueries.products(params));

export const useProduct = (id: string) => useQuery(catalogQueries.product(id));

export const useDealProducts = () => useQuery(catalogQueries.deals());

export const useProductReviews = (productId: string) => useQuery(reviewQueries.forProduct(productId));

/**
 * The backend fetches a store by id, but URLs use the slug. Stores are a short list that is already
 * cached everywhere, so resolve the slug from it instead of adding a request.
 */
export function useStoreBySlug(slug: string) {
  const query = useStores();
  const store = useMemo(() => query.data?.find((s) => s.slug === slug), [query.data, slug]);
  return { ...query, data: store };
}

/** id → Store lookup for rendering a product's or cart line's vendor. */
export function useStoreMap() {
  const query = useStores();
  const map = useMemo(() => new Map<string, Store>((query.data ?? []).map((s) => [s.id, s])), [query.data]);
  return { ...query, map };
}
