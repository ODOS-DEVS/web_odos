import { Truck } from "lucide-react";
import type { Store } from "@/types/catalog";
import { formatMoneyCompact } from "@/libs/format";

/**
 * What a shopper needs to know about delivery before they add to cart. The API exposes a headline and a
 * lowest fee per vendor; exact fees per speed come from the delivery quote at cart and checkout.
 */
export function DeliveryNote({ store }: { store: Store }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-label="Delivery">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="size-4 text-accent" aria-hidden />
        Delivered by {store.name}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">
        This vendor packs your items and delivers them with their own riders, separately from other stores in your cart.
      </p>
      <dl className="mt-4 divide-y divide-line text-sm">
        {store.deliveryBadge && (
          <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0">
            <dt className="text-muted">Offer</dt>
            <dd className="font-medium text-success">{store.deliveryBadge}</dd>
          </div>
        )}
        {store.deliveryFeeFrom !== null && (
          <div className="flex items-baseline justify-between gap-4 py-2.5 last:pb-0">
            <dt className="text-muted">Delivery from</dt>
            <dd className="font-medium tabular-nums">
              {store.deliveryFeeFrom === 0 ? "Free" : formatMoneyCompact(store.deliveryFeeFrom)}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
