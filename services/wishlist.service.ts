import { WISHLIST_ENDPOINTS } from "@/libs/api-endpoint";
import type { WishlistItemCreate, WishlistItemRead } from "@/types/api";
import type { FavoriteItem } from "@/hooks/use-favorites";
import { apiFetch } from "./http";

const toNumber = (value: string | null) => {
  const n = value === null ? Number.NaN : Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Server wishlist row → the same shape the browser favourites store keeps. */
export function toFavoriteItem(row: WishlistItemRead): FavoriteItem {
  const price = toNumber(row.price) ?? 0;
  const old = toNumber(row.old_price);
  return {
    productId: row.product_id,
    // The wishlist row doesn't carry the vendor; it's filled in when the product is next seen.
    storeId: null,
    name: row.title,
    price,
    compareAtPrice: old !== null && old > price ? old : null,
    imageUrl: row.image_url,
    savedAt: row.created_at,
  };
}

/** The signed-in shopper's wishlist on the account (login required). */
export const wishlistService = {
  async list(): Promise<FavoriteItem[]> {
    const rows = await apiFetch<WishlistItemRead[]>(WISHLIST_ENDPOINTS.wishlist, { revalidate: false });
    return rows.map(toFavoriteItem);
  },

  add: (item: FavoriteItem) => {
    const body: WishlistItemCreate = {
      product_id: item.productId,
      title: item.name,
      image_url: item.imageUrl,
      price: String(item.price),
      old_price: item.compareAtPrice === null ? null : String(item.compareAtPrice),
    };
    return apiFetch<WishlistItemRead>(WISHLIST_ENDPOINTS.wishlist, { method: "POST", body });
  },

  remove: (productId: string) => apiFetch<void>(WISHLIST_ENDPOINTS.wishlistItem(productId), { method: "DELETE" }),
};
