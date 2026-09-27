"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DeliveryQuoteInput } from "@/services/delivery.service";
import { deliveryQueries } from "@/services/queries";

/**
 * Live delivery pricing for a basket. Keeps the previous quote on screen while a new one loads, so
 * totals never flash empty when the shopper changes quantity or delivery speed.
 */
export function useDeliveryQuote(input: DeliveryQuoteInput, enabled = true) {
  return useQuery({
    ...deliveryQueries.quote(input),
    enabled: enabled && input.subtotal > 0,
    placeholderData: keepPreviousData,
  });
}
