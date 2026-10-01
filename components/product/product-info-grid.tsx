import type { ReactNode } from "react";
import { Info, ShieldCheck, Store as StoreIcon, Truck } from "lucide-react";
import type { Store } from "@/types/catalog";
import { ButtonLink } from "@/components/ui/button";
import { formatMoneyCompact } from "@/libs/format";

function InfoCard({ icon, title, trailing, children }: { icon: ReactNode; title: ReactNode; trailing?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">{icon}</span>
          {title}
        </div>
        {trailing && <span className="shrink-0 text-xs text-muted">{trailing}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Four trust-building cards about the vendor and the purchase — sold-by, delivery, item info, and returns. */
export function ProductInfoGrid({ store }: { store: Store }) {
  const location = [store.city, store.region].filter(Boolean).join(", ");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <InfoCard
        icon={<StoreIcon className="size-4" aria-hidden />}
        title={
          <>
            Sold by, <span>{store.name}</span>
          </>
        }
        trailing={location || undefined}
      >
        {store.description && <p className="text-sm leading-6 text-muted">{store.description}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={`/stores/${store.slug}`} size="sm" variant="outline">
            Visit Store
          </ButtonLink>
          <ButtonLink href={`/stores/${store.slug}/chat`} size="sm" variant="outline">
            Chat Store
          </ButtonLink>
        </div>
      </InfoCard>

      <InfoCard icon={<Truck className="size-4" aria-hidden />} title={`Delivered by ${store.name}`}>
        <p className="text-sm leading-6 text-muted">
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
              <dd className="font-medium tabular-nums">{store.deliveryFeeFrom === 0 ? "Free" : formatMoneyCompact(store.deliveryFeeFrom)}</dd>
            </div>
          )}
        </dl>
      </InfoCard>

      <InfoCard icon={<Info className="size-4" aria-hidden />} title="About this item">
        <p className="text-sm leading-6 text-muted">
          This listing is shared directly by {store.name}. Photos, pricing and specifications reflect what the vendor has provided to ODOS.
        </p>
      </InfoCard>

      <InfoCard icon={<ShieldCheck className="size-4" aria-hidden />} title="Returns & Support">
        <p className="text-sm leading-6 text-muted">Products can be returned based on ODOS return policy and the seller’s product condition rules.</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          If your item arrives damaged or significantly different, contact support from the order history or chat with the store directly.
        </p>
      </InfoCard>
    </div>
  );
}
