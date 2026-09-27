import type { OrderItemCreate } from "@/types/api";
import type { CartLine } from "@/types/cart";

/** Ghana's 16 administrative regions, as the API's `address_region` expects free text. */
export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Western North",
  "Central",
  "Eastern",
  "Volta",
  "Oti",
  "Northern",
  "Savannah",
  "North East",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
] as const;

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
