import { CATALOG_ENDPOINTS } from "@/libs/api-endpoint";
import type { CategoryRead, MarketRead, MerchandisingCampaignRead, ProductRead, PromoBannerRead, StoreRead, StoreSectionRead, DealsHubRead } from "@/types/api";
import type { Campaign, CampaignDetail, Category, Market, Product, PromoBanner, Store, DealsHub } from "@/types/catalog";
import { apiFetch } from "./http";
import { toCampaign, toCategory, toMarket, toProduct, toPromoBanner, toStore, toVoucher } from "./mappers";

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
    return rows.map(toMarket).sort((a, b) => a.sortOrder - b.sortOrder);
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

  /**
   * Full-text search across the catalogue. Public, and not capped at the 100-product page the
   * list endpoint returns — which is why searching cannot just filter the loaded list.
   */
  async search(query: string, limit = 50): Promise<Product[]> {
    const result = await apiFetch<{ results?: { product: ProductRead }[] }>(CATALOG_ENDPOINTS.search, {
      query: { q: query, limit },
    });
    return (result.results ?? []).map((row) => toProduct(row.product));
  },

  async product(id: string): Promise<Product> {
    return toProduct(await apiFetch<ProductRead>(CATALOG_ENDPOINTS.product(id)));
  },

  async dealProducts(params: { min_discount_percent?: number; campaign_tag?: string; limit?: number; offset?: number } = {}) {
    const rows = await apiFetch<ProductRead[]>(CATALOG_ENDPOINTS.dealProducts, { query: params });
    return rows.map(toProduct);
  },

  /** Featured first, then by the priority marketing set. Empty until a campaign is published. */
  /** The deals destination in one call. Anonymous-friendly; `claimed` flags light up when logged in. */
  async dealsHub(): Promise<DealsHub> {
    const hub = await apiFetch<DealsHubRead>(CATALOG_ENDPOINTS.dealsHub);
    return {
      sections: (hub.sections ?? []).map((s) => ({
        key: s.key,
        title: s.title,
        subtitle: s.subtitle ?? null,
        kind: s.kind,
        count: s.count ?? null,
      })),
      flashEvents: (hub.flash_events ?? []).map((e) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        subtitle: e.subtitle ?? null,
        imageUrl: e.image_url ?? null,
        endsAt: e.ends_at,
        productCount: e.product_count ?? 0,
      })),
      promotions: (hub.promotions ?? []).map(toVoucher),
      dealProducts: (hub.deal_products ?? []).map(toProduct),
      campaigns: (hub.campaigns ?? []).map(toCampaign),
    };
  },

  async campaigns(): Promise<Campaign[]> {
    const rows = await apiFetch<MerchandisingCampaignRead[]>(CATALOG_ENDPOINTS.campaigns);
    return rows
      .map(toCampaign)
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.displayPriority - a.displayPriority);
  },

  /** One campaign and its products. Throws `ApiError` 404 when the slug is unknown. */
  async campaign(slug: string): Promise<CampaignDetail> {
    const row = await apiFetch<MerchandisingCampaignRead & { products?: ProductRead[]; has_more?: boolean }>(
      CATALOG_ENDPOINTS.campaign(slug),
    );
    return {
      ...toCampaign(row),
      products: (row.products ?? []).map(toProduct),
      hasMore: Boolean(row.has_more),
    };
  },

  async promoBanners(): Promise<PromoBanner[]> {
    const rows = await apiFetch<PromoBannerRead[]>(CATALOG_ENDPOINTS.promoBanners);
    return rows.map(toPromoBanner).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async flashSaleProducts(slug: string) {
    const rows = await apiFetch<ProductRead[]>(CATALOG_ENDPOINTS.flashSaleProducts(slug));
    return rows.map(toProduct);
  },
};
