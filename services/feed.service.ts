import { FEED_ENDPOINTS } from "@/libs/api-endpoint";
import { toProduct } from "./mappers";
import type { ProductRead } from "@/types/api";
import type { Product } from "@/types/catalog";
import { apiFetch } from "./http";

/* ---------- Wire shapes ---------- */

type FeedSectionRead = {
  title: string;
  subtitle?: string | null;
  category?: string | null;
  count: number;
  products: ProductRead[];
};

type HomeFeedRead = {
  generated_at: string;
  /** False for a signed-out or brand-new shopper: the sections are best-sellers, not history. */
  personalized: boolean;
  sections: Record<string, FeedSectionRead>;
};

export type FeedSection = {
  key: string;
  title: string;
  subtitle: string | null;
  products: Product[];
};

export type HomeFeed = {
  personalized: boolean;
  sections: FeedSection[];
};

/**
 * The order sections are shown in, mirroring the mobile app's `sectionOrder` in
 * `components/home/HomeScreen.tsx` so both clients tell the same story. A section the API does
 * not return for this shopper (recently_viewed before they have browsed anything, wishlist
 * before they have saved anything) is simply absent, not empty.
 */
export const FEED_SECTION_ORDER = [
  "recommended",
  "trending",
  "recently_viewed",
  "wishlist",
  "category_spotlight",
] as const;

export const feedService = {
  /**
   * Personalised home sections. Public — a signed-out shopper gets best-sellers rather than a
   * 401, which is why this is safe to prefetch on the server for everyone.
   */
  async home(limitPerSection = 12): Promise<HomeFeed> {
    const feed = await apiFetch<HomeFeedRead>(FEED_ENDPOINTS.homeFeed, {
      query: { full_products: true, limit_per_section: limitPerSection },
      // Personalised per shopper, so never cached at the edge.
      revalidate: false,
    });

    const raw = feed.sections ?? {};
    const ordered = [
      ...FEED_SECTION_ORDER.filter((key) => raw[key]),
      ...Object.keys(raw).filter((key) => !FEED_SECTION_ORDER.includes(key as never)),
    ];

    return {
      personalized: Boolean(feed.personalized),
      sections: ordered
        .map((key) => {
          const section = raw[key];
          return {
            key,
            title: section.title,
            subtitle: section.subtitle ?? null,
            products: (section.products ?? []).map(toProduct),
          };
        })
        .filter((section) => section.products.length > 0),
    };
  },

  async section(sectionKey: string, limit = 30, offset = 0): Promise<Product[]> {
    const rows = await apiFetch<{ products?: ProductRead[] } | ProductRead[]>(
      FEED_ENDPOINTS.homeFeedSection(sectionKey),
      { query: { limit, offset }, revalidate: false },
    );
    const products = Array.isArray(rows) ? rows : (rows.products ?? []);
    return products.map(toProduct);
  },
};
