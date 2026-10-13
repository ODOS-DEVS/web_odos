import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone, TreePalm, Star, Truck } from "lucide-react";
import type { ReactNode } from "react";
import type { Store } from "@/types/catalog";
import { formatMoneyCompact } from "@/libs/format";
import { ButtonLink } from "@/components/ui/button";
import { Media } from "@/components/ui/media";

/** Cover image + identity row. Only the logo overlaps the cover; the name sits fully below it. */
export function StoreHeader({ store }: { store: Store }) {
  const place = [store.city, store.region].filter(Boolean).join(", ");

  return (
    <>
      <div className="relative h-44 overflow-hidden rounded-2xl bg-surface-muted sm:h-64 sm:rounded-3xl">
        <Media src={store.bannerUrl ?? store.logoUrl} name={store.name} priority sizes="100vw" className="size-full" />
        {/* Soft top scrim keeps the back control legible over any banner. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-foreground/20 to-transparent" aria-hidden />
        <Link
          href="/stores"
          className="press absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 py-2 pr-3.5 pl-3 text-xs font-medium shadow-sm backdrop-blur-md min-[360px]:top-4 min-[360px]:left-4 min-[360px]:pr-4 min-[360px]:text-sm hover:bg-surface"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All stores
        </Link>
      </div>

      <header className="relative px-0 min-[400px]:px-3 sm:px-8">
        <Media
          src={store.logoUrl}
          name={store.name}
          priority
          sizes="112px"
          className="-mt-8 size-16 shrink-0 rounded-2xl bg-surface ring-4 ring-background min-[360px]:-mt-10 min-[360px]:size-20 min-[400px]:-mt-12 min-[400px]:size-24 min-[400px]:rounded-3xl sm:-mt-14 sm:size-28"
          imgClassName="object-contain p-1.5"
        />

        {/* Full-width below the logo, not squeezed beside it. */}
        <div className="mt-3 min-w-0 min-[400px]:mt-4">
          {/* Name + rating pill on one line, like a marketplace shop header (Etsy, Depop). */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="max-w-full text-xl leading-tight font-semibold min-[360px]:text-2xl min-[400px]:text-3xl sm:text-4xl">{store.name}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-xs font-semibold min-[400px]:px-2.5 min-[400px]:text-sm">
              <Star className="size-3.5 fill-current text-warning" aria-hidden />
              {store.rating > 0 ? store.rating.toFixed(1) : "New"}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-muted min-[400px]:text-base sm:text-lg">{[store.category, place].filter(Boolean).join(" · ")}</p>
        </div>

        {/* Primary way to reach the vendor, promoted out of the About card (Faire's Message button). */}
        {(store.whatsappUrl || store.phone || store.email) && (
          <div className="mt-3 flex w-full gap-2 min-[400px]:mt-4 sm:w-auto">
            {store.whatsappUrl && (
              <ButtonLink href={store.whatsappUrl} target="_blank" rel="noopener noreferrer" variant="accent" size="sm" className="flex-1 sm:flex-none">
                <MessageCircle className="size-4" aria-hidden />
                Message
              </ButtonLink>
            )}
            {store.phone && (
              <ButtonLink href={`tel:${store.phone}`} variant="outline" size="icon" aria-label={`Call ${store.name}`}>
                <Phone className="size-4" aria-hidden />
              </ButtonLink>
            )}
            {!store.whatsappUrl && store.email && (
              <ButtonLink href={`mailto:${store.email}`} variant="outline" size="icon" aria-label={`Email ${store.name}`}>
                <Mail className="size-4" aria-hidden />
              </ButtonLink>
            )}
          </div>
        )}
      </header>
    </>
  );
}

function Cell({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-surface p-3 min-[400px]:p-4">
      <span className="hidden size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent min-[400px]:grid">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="text-sm leading-snug font-semibold">{children}</dd>
      </div>
    </div>
  );
}

/** The four facts a shopper scans first: rating, place, delivery, availability. */
export function StoreInfoBar({ store }: { store: Store }) {
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line min-[320px]:grid-cols-2 lg:grid-cols-4">
      <Cell icon={<Star className="size-5" aria-hidden />} label="Rating">
        {store.rating > 0 ? <span className="tabular-nums">{store.rating.toFixed(1)} / 5</span> : "New on ODOS"}
      </Cell>
      <Cell icon={<MapPin className="size-5" aria-hidden />} label="Location">
        {store.city ?? "Ghana"}
      </Cell>
      <Cell icon={<Truck className="size-5" aria-hidden />} label="Delivery">
        <span className="tabular-nums">
          {store.deliveryFeeFrom === null ? (store.deliveryBadge ?? "At checkout") : store.deliveryFeeFrom === 0 ? "Free" : `From ${formatMoneyCompact(store.deliveryFeeFrom)}`}
        </span>
      </Cell>
      <Cell icon={store.isOnVacation ? <TreePalm className="size-5" aria-hidden /> : <Clock className="size-5" aria-hidden />} label="Status">
        {store.isOnVacation ? (
          "On vacation"
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            Taking orders
          </span>
        )}
      </Cell>
    </dl>
  );
}
