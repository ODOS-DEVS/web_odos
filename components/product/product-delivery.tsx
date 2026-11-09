"use client";

import { Truck } from "lucide-react";
import { useDeliveryQuote } from "@/hooks/use-delivery-quote";
import { formatMoneyCompact } from "@/libs/format";
import type { Product } from "@/types/catalog";

/**
 * Live delivery options for this one item (POST /delivery/quote). Exact fees for the whole basket and
 * the shopper's address are confirmed again at checkout.
 */
export function ProductDelivery({ product }: { product: Product }) {
  const quote = useDeliveryQuote({
    subtotal: product.price,
    items: [{ productId: product.id, quantity: 1, unitPrice: product.price }],
  });

  const options = quote.data?.options ?? [];
  if (quote.isError || (!quote.isPending && options.length === 0)) return null;

  return (
    <section aria-labelledby="delivery-heading" className="rounded-2xl border border-line bg-surface p-5">
      <h2 id="delivery-heading" className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="size-4 text-accent" aria-hidden />
        Delivery options
      </h2>
      {quote.isPending ? (
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-surface-muted" aria-busy="true" />
      ) : (
        <dl className="mt-3 divide-y divide-line text-sm">
          {options.map((option) => (
            <div key={option.id} className="flex items-baseline justify-between gap-4 py-2.5 last:pb-0">
              <dt className={option.available ? "" : "text-muted"}>
                <span className="font-medium">{option.title}</span>
                <span className="ml-2 text-xs text-muted">{option.available ? option.eta : option.unavailableReason}</span>
              </dt>
              <dd className="shrink-0 font-medium tabular-nums">
                {!option.available ? "—" : option.amount === 0 ? "Free" : formatMoneyCompact(option.amount)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {quote.data && quote.data.freeThreshold > 0 && (
        <p className="mt-3 text-xs text-muted">Free delivery on orders over {formatMoneyCompact(quote.data.freeThreshold)}.</p>
      )}
    </section>
  );
}
