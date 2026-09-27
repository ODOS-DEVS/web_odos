import Link from "next/link";
import { MapPin, Star, Truck } from "lucide-react";
import type { Store } from "@/types/catalog";
import { formatMoneyCompact } from "@/libs/format";
import { Media } from "@/components/ui/media";

/**
 * Store card: the vendor's own banner as the cover, a bold offer tag, the logo as a small identity mark,
 * and three quiet lines beneath. The whole card is one link.
 */
export function StoreCard({ store, priority }: { store: Store; priority?: boolean }) {
  const place = [store.city, store.region].filter(Boolean).join(", ");

  return (
    <article className="group relative flex flex-col rounded-2xl has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-accent">
      <div className="relative aspect-16/11 overflow-hidden rounded-2xl bg-surface-muted">
        <Media
          src={store.bannerUrl ?? store.logoUrl}
          name={store.name}
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="size-full"
          imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />

        {/* Offer tag: solid and bold so it reads before anything else, like a shelf label. */}
        {store.deliveryBadge && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
            <Truck className="size-3.5" aria-hidden />
            {store.deliveryBadge}
          </span>
        )}
        {store.isOnVacation && (
          <span className="absolute top-3 right-3 rounded-md bg-surface px-2.5 py-1 text-xs font-semibold shadow-sm">On vacation</span>
        )}

        <Media
          src={store.logoUrl}
          name={store.name}
          sizes="48px"
          className="absolute bottom-3 left-3 size-12 rounded-xl bg-surface shadow-md ring-2 ring-surface"
          imgClassName="object-contain p-1"
        />
      </div>

      <div className="mt-3.5 px-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 truncate text-base font-semibold tracking-tight">
            <Link
              href={`/stores/${store.slug}`}
              className="underline-offset-4 group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {store.name}
            </Link>
          </h3>
          {store.rating > 0 && (
            <p className="flex shrink-0 items-center gap-1 text-sm" aria-label={`Rated ${store.rating.toFixed(1)} out of 5`}>
              <Star className="size-3.5 fill-current text-warning" aria-hidden />
              <span className="font-semibold tabular-nums">{store.rating.toFixed(1)}</span>
            </p>
          )}
        </div>
        {store.category && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{store.category}</p>}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
          {place && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {place}
            </span>
          )}
          {store.deliveryFeeFrom !== null && (
            <span className="tabular-nums">{store.deliveryFeeFrom === 0 ? "Free delivery" : `From ${formatMoneyCompact(store.deliveryFeeFrom)}`}</span>
          )}
        </p>
      </div>
    </article>
  );
}

export function StoreCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-16/11 animate-pulse rounded-2xl bg-surface-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
    </div>
  );
}
