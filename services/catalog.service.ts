import { CATALOG_ENDPOINTS } from "@/libs/api-endpoint";
import type { CategoryRead, MarketRead, ProductRead, StoreRead, StoreSectionRead } from "@/types/api";
import type { Category, Product, Store } from "@/types/catalog";
import { apiFetch } from "./http";
import { toCategory, toProduct, toStore } from "./mappers";

/** Query params accepted by GET /catalog/products (the API caps `limit` at 100). */
export type ProductListParams = {
  audience?: string;
  section?: string;
  placement?: string;
  flash_event?: string;
  category?: string;
  subcategory?: string;
  store_id?: string;
  max_age_days?: number;
  limit?: number;
  offset?: number;
};

export type StoreListParams = { market_slug?: string; category?: string; audience?: string };

export type StoreSection = { id: string; title: string; slug: string; products: Product[] };

export const catalogService = {
  async categories(): Promise<Category[]> {
    const rows = await apiFetch<CategoryRead[]>(CATALOG_ENDPOINTS.categories);
    return rows.map(toCategory).sort((a, b) => a.name.localeCompare(b.name));
  },

  markets: () => apiFetch<MarketRead[]>(CATALOG_ENDPOINTS.markets),

  async stores(params: StoreListParams = {}): Promise<Store[]> {
    const rows = await apiFetch<StoreRead[]>(CATALOG_ENDPOINTS.stores, { query: params });
    return rows.map(toStore);
  },

  async store(id: string): Promise<Store> {
    return toStore(await apiFetch<StoreRead>(CATALOG_ENDPOINTS.store(id)));
  },

  async storeSections(storeId: string): Promise<StoreSection[]> {
    const rows = await apiFetch<StoreSectionRead[]>(CATALOG_ENDPOINTS.storeSections(storeId));
    return rows.map((s) => ({ id: s.id, title: s.title, slug: s.slug, products: (s.products ?? []).map(toProduct) }));
  },

  async products(params: ProductListParams = {}): Promise<Product[]> {
    const rows = await apiFetch<ProductRead[]>(CATALOG_ENDPOINTS.products, { query: { limit: 100, ...params } });
    return rows.map(toProduct);
  },

  async product(id: string): Promise<Product> {
    return toProduct(await apiFetch<ProductRead>(CATALOG_ENDPOINTS.product(id)));
  },

  async dealProducts(params: { min_discount_percent?: number; campaign_tag?: string; limit?: number; offset?: number } = {}) {
    const rows = await apiFetch<ProductRead[]>(CATALOG_ENDPOINTS.dealProducts, { query: params });
    return rows.map(toProduct);
  },

  async flashSaleProducts(slug: string) {
    const rows = await apiFetch<ProductRead[]>(CATALOG_ENDPOINTS.flashSaleProducts(slug));
    return rows.map(toProduct);
  },
};
