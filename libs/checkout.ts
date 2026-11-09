import type { OrderItemCreate } from "@/types/api";
import type { CartLine } from "@/types/cart";

/** Ghana's 16 administrative regions, as the API's `address_region` expects free text. */
// Single source of truth, shared with the mobile app. Re-exported here so the existing
// `@/libs/checkout` imports keep working.
export { GHANA_REGIONS } from "./ghana-locations";

export const toOrderItems = (lines: CartLine[]): OrderItemCreate[] =>
  lines.map((l) => ({
    product_id: l.productId,
    title: l.name,
    image_url: l.imageUrl,
    quantity: l.quantity,
    unit_price: l.price,
    selected_size: l.size,
    selected_color: l.color,
  }));
