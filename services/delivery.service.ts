import { DELIVERY_ENDPOINTS } from "@/libs/api-endpoint";
import type { DeliveryQuoteRead, DeliveryQuoteRequest } from "@/types/api";
import type { DeliveryQuote } from "@/types/delivery";
import { apiFetch } from "./http";

export type DeliveryQuoteInput = {
  subtotal: number;
  method?: DeliveryQuoteRequest["selected_method"];
  city?: string;
  region?: string;
  items?: { productId: string; quantity: number; unitPrice: number }[];
};

function toQuote(q: DeliveryQuoteRead): DeliveryQuote {
  return {
    options: q.options.map((o) => ({
      id: o.id,
      title: o.title,
      subtitle: o.subtitle,
      eta: o.eta,
      amount: o.amount,
      badge: o.badge ?? null,
      available: o.available,
      unavailableReason: o.unavailable_reason ?? null,
    })),
    selected: q.selected_method,
    shippingAmount: q.shipping_amount,
    freeThreshold: q.free_shipping_threshold,
    sameDayCutoffPassed: q.same_day_cutoff_passed,
    packages: (q.packages ?? []).map((p) => ({
      storeId: p.store_id ?? null,
      storeName: p.store_name ?? null,
      itemsSubtotal: p.items_subtotal,
      deliveryFee: p.delivery_fee,
      feeWaived: Boolean(p.fee_waived),
      freeThreshold: p.free_threshold ?? 0,
      amountToFreeDelivery: p.amount_to_free_delivery ?? null,
    })),
  };
}

export const deliveryService = {
  /** Public: prices each delivery speed and the per-vendor packages for a basket. */
  async quote(input: DeliveryQuoteInput): Promise<DeliveryQuote> {
    const body: DeliveryQuoteRequest = {
      subtotal: input.subtotal,
      selected_method: input.method ?? "economy",
      city: input.city,
      region: input.region,
      items: input.items?.map((i) => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice })),
    };
    return toQuote(await apiFetch<DeliveryQuoteRead>(DELIVERY_ENDPOINTS.quote, { method: "POST", body, revalidate: false }));
  },
};
