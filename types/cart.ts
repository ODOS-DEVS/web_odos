import type { Store } from "./catalog";

/**
 * A cart line keeps a snapshot of the product (name, price, image) so the cart renders instantly and
 * offline. Prices are re-checked by the delivery quote and the order endpoint on the server.
 */
export type CartLine = {
  /** productId + chosen variant: the same product in two sizes is two lines. */
  key: string;
  productId: string;
  storeId: string | null;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  /** Stock when added, used to cap the quantity stepper. */
  stock: number;
};

/** A cart section for a single vendor — becomes one order package at checkout. */
export type CartGroup = {
  storeId: string | null;
  store: Store | undefined;
  name: string;
  lines: CartLine[];
  subtotal: number;
};
