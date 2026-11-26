import type { OrderItemCreate } from "@/types/api";
import type { CartLine } from "@/types/cart";
import { lineUnitPrice } from "./cart";

/** Ghana's 16 administrative regions, as the API's `address_region` expects free text. */
// Single source of truth, shared with the mobile app. Re-exported here so the existing
// `@/libs/checkout` imports keep working.
export { GHANA_REGIONS } from "./ghana-locations";

/**
 * Cart lines as the order endpoint wants them.
 *
 * `unit_price` is the privately agreed price where the shopper has one. The
 * server does not take our word for it — it resolves the agreement from the
 * session and recomputes every line — but it *does* compare the totals it
 * computed against the ones we sent, and rejects the order if they differ.
 * Sending list prices for a negotiated line therefore failed checkout
 * outright with "The order totals didn't match the selected items", which is
 * why an agreed price could be struck but never spent.
 */
export const toOrderItems = (lines: CartLine[]): OrderItemCreate[] =>
  lines.map((l) => ({
    product_id: l.productId,
    title: l.name,
    image_url: l.imageUrl,
    quantity: l.quantity,
    unit_price: lineUnitPrice(l),
    selected_size: l.size,
    selected_color: l.color,
  }));
