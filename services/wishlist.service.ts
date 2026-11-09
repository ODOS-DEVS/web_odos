import { WISHLIST_ENDPOINTS } from "@/libs/api-endpoint";
import type { FavoriteItem } from "@/types/account";
import type { Product } from "@/types/catalog";
import { apiFetch } from "./http";

/** The API stores the price fields as strings, so they come back as strings too. */
type WishlistItemRead = {
  id: string;
  product_id: string;
  title: string;
  image_url?: string | null;
  category?: string | null;
  price?: string | null;
  old_price?: string | null;
  created_at: string;
};

const num = (value: string | null | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function toFavorite(w: WishlistItemRead): FavoriteItem {
  const compare = w.old_price == null ? null : num(w.old_price);
  const price = num(w.price);
  return {
    productId: w.product_id,
    storeId: null,
    name: w.title,
    price,
    // Only a genuinely higher "was" price is worth showing.
    compareAtPrice: compare && compare > price ? compare : null,
    imageUrl: w.image_url ?? null,
    savedAt: w.created_at,
  };
}

export const wishlistService = {
  async list(): Promise<FavoriteItem[]> {
    const rows = await apiFetch<WishlistItemRead[]>(WISHLIST_ENDPOINTS.wishlist, { revalidate: false });
    return rows.map(toFavorite);
  },

  add: (product: Product) =>
    apiFetch<unknown>(WISHLIST_ENDPOINTS.wishlist, {
      method: "POST",
      body: {
        product_id: product.id,
        title: product.name,
        image_url: product.images[0] ?? null,
        category: product.categoryName || null,
        // Strings on the wire, matching what the backend stores.
        price: String(product.price),
        old_price: product.compareAtPrice == null ? null : String(product.compareAtPrice),
      },
    }),

  remove: (productId: string) => apiFetch<unknown>(WISHLIST_ENDPOINTS.wishlistItem(productId), { method: "DELETE" }),
};
