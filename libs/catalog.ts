/**
 * Pure helpers over catalogue data already fetched through TanStack Query. No data access lives here:
 * services fetch, hooks cache, and these functions filter/sort/lookup in memory.
 */
import type { Product, ProductTag, Store } from "@/types/catalog";

export type ProductSort = "featured" | "price-asc" | "price-desc" | "rating";

export type ProductFilters = {
  q?: string;
  /** Category slug. */
  category?: string;
  /** Store slug. */
  store?: string;
  /** Market slug — stores are each tied to at most one physical market. */
  market?: string;
  tag?: ProductTag;
  freeDelivery?: boolean;
  sort?: ProductSort;
};

export const isFreeDeliveryStore = (store: Store | undefined) => Boolean(store?.deliveryBadge && /free/i.test(store.deliveryBadge));

export function filterProducts(products: Product[], stores: Store[], filters: ProductFilters): Product[] {
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const needle = filters.q?.trim().toLowerCase();
  const storeId = filters.store ? stores.find((s) => s.slug === filters.store)?.id : undefined;

  const result = products.filter((p) => {
    if (needle) {
      const haystack = `${p.name} ${p.description} ${p.categoryName} ${p.subcategory ?? ""} ${(p.storeId && storeById.get(p.storeId)?.name) || ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (filters.category && !p.categorySlugs.includes(filters.category)) return false;
    if (filters.store && p.storeId !== storeId) return false;
    if (filters.market && (p.storeId ? storeById.get(p.storeId)?.marketSlug : undefined) !== filters.market) return false;
    if (filters.tag && !p.tags.includes(filters.tag)) return false;
    if (filters.freeDelivery && !isFreeDeliveryStore(p.storeId ? storeById.get(p.storeId) : undefined)) return false;
    return true;
  });

  switch (filters.sort) {
    case "price-asc":
      return [...result].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...result].sort((a, b) => b.price - a.price);
    case "rating":
      return [...result].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    default:
      return result;
  }
}

/** Newest first, for "New arrivals". */
export const newestFirst = (products: Product[]) =>
  [...products].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

export function relatedProducts(all: Product[], product: Product, limit = 4) {
  return all
    .filter((p) => p.id !== product.id && (p.storeId === product.storeId || p.categorySlugs.some((c) => product.categorySlugs.includes(c))))
    .slice(0, limit);
}
