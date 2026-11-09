import { CART_ENDPOINTS } from "@/libs/api-endpoint";
import type { CartItemCreate, CartItemRead } from "@/types/api";
import { apiFetch } from "./http";

/** A server cart row. The account cart has no size/colour, only a quantity per product. */
export type ServerCartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

const toItem = (row: CartItemRead): ServerCartItem => ({
  productId: row.product_id,
  name: row.title,
  price: Number(row.price) || 0,
  imageUrl: row.image_url,
  quantity: row.quantity,
});

/** The signed-in shopper's cart on the account (login required for every call). */
export const cartService = {
  async list(): Promise<ServerCartItem[]> {
    const rows = await apiFetch<CartItemRead[]>(CART_ENDPOINTS.cart, { revalidate: false });
    return rows.map(toItem);
  },

  add: (item: { productId: string; name: string; price: number; imageUrl: string | null; category?: string | null; quantity: number }) => {
    const body: CartItemCreate = {
      product_id: item.productId,
      title: item.name,
      price: String(item.price),
      image_url: item.imageUrl,
      category: item.category ?? null,
      quantity: item.quantity,
    };
    return apiFetch<CartItemRead>(CART_ENDPOINTS.cart, { method: "POST", body });
  },

  setQuantity: (productId: string, quantity: number) =>
    apiFetch<CartItemRead>(CART_ENDPOINTS.cartItem(productId), { method: "PATCH", body: { quantity } }),

  remove: (productId: string) => apiFetch<void>(CART_ENDPOINTS.cartItem(productId), { method: "DELETE" }),

  clear: () => apiFetch<void>(CART_ENDPOINTS.cart, { method: "DELETE" }),
};
