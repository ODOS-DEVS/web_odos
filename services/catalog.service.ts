import { CATALOG_ENDPOINTS, FEED_ENDPOINTS } from "@/libs/api-endpoint";
import type {
  CategoryRead,
  MarketRead,
  MerchandisingCampaignRead,
  ProductRead,
  PromoBannerRead,
  RecommendationFeedRead,
  SearchResponseRead,
  StoreRead,
  StoreSectionRead,
  FlashSaleEventRead,
} from "@/types/api";
import type { Campaign, Category, Market, Product, PromoBanner, Store, FlashSaleEvent } from "@/types/catalog";
import { apiFetch } from "./http";
import { toCampaign, toCategory, toMarket, toProduct, toPromoBanner, toStore, toFlashSaleEvent } from "./mappers";

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

  async markets(): Promise<Market[]> {
    const rows = await apiFetch<MarketRead[]>(CATALOG_ENDPOINTS.markets);
    return [...rows].sort((a, b) => a.sort_order - b.sort_order).map(toMarket);
  },

  /** Admin-managed banners, in display order. `placement` narrows them to one slot when set. */
  async promoBanners(params: { placement?: string } = {}): Promise<PromoBanner[]> {
    const rows = await apiFetch<PromoBannerRead[]>(CATALOG_ENDPOINTS.promoBanners, { query: params });
    return [...rows].sort((a, b) => a.sort_order - b.sort_order).map(toPromoBanner);
  },

  /** Live merchandising campaigns, highest display priority first. */
  async campaigns(params: { featured?: boolean; limit?: number } = {}): Promise<Campaign[]> {
    const rows = await apiFetch<MerchandisingCampaignRead[]>(CATALOG_ENDPOINTS.campaigns, { query: params });
    return [...rows].sort((a, b) => (b.display_priority ?? 0) - (a.display_priority ?? 0)).map(toCampaign);
  },

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

  async dealProducts(
    params: { min_discount_percent?: number; campaign_tag?: string; limit?: number; offset?: number } = {},
  ) {
    const rows = await apiFetch<ProductRead[]>(CATALOG_ENDPOINTS.dealProducts, { query: params });
    return rows.map(toProduct);
  },

  /** Running flash sales, in the admin's display order. Ended events are dropped client-side too. */
  async flashSaleEvents(): Promise<FlashSaleEvent[]> {
    const rows = await apiFetch<FlashSaleEventRead[]>(CATALOG_ENDPOINTS.flashSaleEventsActive, { revalidate: 30 });
    return [...rows]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(toFlashSaleEvent)
      .filter((e) => Date.parse(e.endsAt) > Date.now());
  },

  /** Products in one flash sale, carrying their sale price and units left. */
  async flashSaleProducts(slug: string) {
    const rows = await apiFetch<ProductRead[]>(CATALOG_ENDPOINTS.flashSaleProducts(slug));
    return rows.map(toProduct);
  },

  /** Ranked full-text search over the whole catalogue (title, description, category, store). */
  async search(q: string, limit = 50): Promise<Product[]> {
    const data = await apiFetch<SearchResponseRead>(CATALOG_ENDPOINTS.search, { query: { q, limit } });
    return data.results.map((r) => toProduct(r.product));
  },

  /** "More like this" for a product page. Works signed out; personalised when signed in. */
  async similar(productId: string, limit = 8): Promise<Product[]> {
    const data = await apiFetch<RecommendationFeedRead>(FEED_ENDPOINTS.recommendationsSimilar(productId), {
      query: { limit },
    });
    return (data.products ?? []).map(toProduct);
  },
};
