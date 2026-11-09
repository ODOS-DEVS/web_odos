"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProductListParams, StoreListParams } from "@/services/catalog.service";
import { catalogQueries, reviewQueries } from "@/services/queries";
import type { Store } from "@/types/catalog";

export const useCategories = () => useQuery(catalogQueries.categories());

export const useMarkets = () => useQuery(catalogQueries.markets());

export const usePromoBanners = () => useQuery(catalogQueries.promoBanners());

export const useCampaigns = () => useQuery(catalogQueries.campaigns());

export const useStores = (params: StoreListParams = {}) => useQuery(catalogQueries.stores(params));

export const useStore = (storeId: string | undefined) =>
  useQuery({ ...catalogQueries.store(storeId ?? ""), enabled: Boolean(storeId) });

export const useStoreSections = (storeId: string | undefined) =>
  useQuery({ ...catalogQueries.storeSections(storeId ?? ""), enabled: Boolean(storeId) });

export const useProducts = (params: ProductListParams = {}) => useQuery(catalogQueries.products(params));

export const useProduct = (id: string) => useQuery(catalogQueries.product(id));

export const useDealProducts = () => useQuery(catalogQueries.deals());

export const useFlashSaleEvents = () => useQuery(catalogQueries.flashSaleEvents());

export const useFlashSaleProducts = (slug: string | undefined) =>
  useQuery({ ...catalogQueries.flashSaleProducts(slug ?? ""), enabled: Boolean(slug) });

export const useCampaignProducts = (campaign: string | undefined) =>
  useQuery({ ...catalogQueries.campaignProducts(campaign ?? ""), enabled: Boolean(campaign) });

export const useProductSearch = (q: string | undefined) =>
  useQuery({ ...catalogQueries.search(q ?? ""), enabled: Boolean(q) });

export const useSimilarProducts = (productId: string) => useQuery(catalogQueries.similar(productId));

export const useProductReviews = (productId: string) => useQuery(reviewQueries.forProduct(productId));

/**
 * The backend fetches a store by id, but URLs use the slug. Stores are a short list that is already
 * cached everywhere, so resolve the slug from it instead of adding a request.
 */
export function useStoreBySlug(slug: string) {
  const query = useStores();
  // Threads/links for vendors missing a slug fall back to the store id.
  const store = useMemo(
    () => query.data?.find((s) => s.slug === slug) ?? query.data?.find((s) => s.id === slug),
    [query.data, slug],
  );
  return { ...query, data: store };
}

/** Resolves a market by slug or id from the cached market list. */
export function useMarketBySlug(slug: string) {
  const query = useMarkets();
  const market = useMemo(
    () => query.data?.find((m) => m.slug === slug || m.id === slug),
    [query.data, slug],
  );
  return { ...query, data: market };
}

/** id → Store lookup for rendering a product's or cart line's vendor. */
export function useStoreMap() {
  const query = useStores();
  const map = useMemo(() => new Map<string, Store>((query.data ?? []).map((s) => [s.id, s])), [query.data]);
  return { ...query, map };
}
