"use client";

import Link from "next/link";
import { ArrowRight, CalendarRange, Clock, Package, Store } from "lucide-react";
import { Media } from "@/components/ui/media";
import { campaignTiming } from "@/libs/campaign-timing";
import { cn } from "@/libs/cn";
import { inkFor } from "@/libs/contrast";
import { trackPromoClick, usePromoImpression } from "@/libs/promo-analytics";
import type { Campaign } from "@/types/catalog";

const DATE = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

const formatRange = (startsAt: string | null, endsAt: string | null): string | null => {
  const start = startsAt ? new Date(startsAt) : null;
  const end = endsAt ? new Date(endsAt) : null;
  const ok = (d: Date | null): d is Date => Boolean(d) && !Number.isNaN(d!.getTime());
  if (ok(start) && ok(end)) return `${DATE.format(start)} – ${DATE.format(end)}`;
  if (ok(end)) return `Until ${DATE.format(end)}`;
  if (ok(start)) return `From ${DATE.format(start)}`;
  return null;
};

/** Tiny uppercase group label, as in the reference card. */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold tracking-[0.12em] text-muted uppercase">{children}</p>;
}

/** Outlined pill holding one fact. The reference uses the same shape for every value. */
function Pill({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold whitespace-nowrap sm:text-sm">
      {icon}
      {children}
    </span>
  );
}

/**
 * One campaign, as a large split card: artwork on the left, the pitch on the right.
 *
 * The composition follows the reference exactly — full-bleed photograph down one half, a tinted
 * eyebrow pill sitting over it, and a white panel opposite holding the title, a quiet subtitle,
 * then small uppercase labels above rows of outlined pills. Every campaign renders through this
 * one component; only its content changes, so a Christmas sale and a Black Friday sale are the
 * same object with different words and artwork.
 *
 * The eyebrow and the primary button are the only places the campaign's theme colour is used.
 * Tinting the whole panel, as this card used to, made the title unreadable on pale themes and
 * meant two campaigns side by side looked like two different components.
 */
export function CampaignCard({
  campaign,
  source = "home",
  className,
  priority = false,
}: {
  campaign: Campaign;
  source?: string;
  className?: string;
  /** Set on the first slide so the artwork is not lazy-loaded above the fold. */
  priority?: boolean;
}) {
  usePromoImpression("campaign", campaign.id, source);

  const timing = campaignTiming(campaign);
  const range = formatRange(campaign.startsAt, campaign.endsAt);
  const accent = campaign.themeColor ?? "var(--accent)";
  const ink = inkFor(campaign.themeColor);
  const onAccent = campaign.themeColor ? (ink === "light" ? "#fff" : "#111827") : "var(--background)";

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      onClick={() => trackPromoClick("campaign", campaign.id, source)}
      aria-label={`${campaign.title} campaign`}
      className={cn(
        "group block overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-sm",
        "transition-shadow duration-300 hover:shadow-xl focus-visible:shadow-xl",
        className,
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
        {/* Artwork. Fixed aspect on its own so a tall or wide upload is cropped, never stretched. */}
        <div className="relative">
          <Media
            src={campaign.bannerImageUrl ?? campaign.thumbnailImageUrl}
            name={campaign.title}
            sizes="(min-width: 768px) 45vw, 100vw"
            priority={priority}
            className="aspect-[4/3] w-full sm:aspect-[16/10] md:h-full md:min-h-[21rem] md:aspect-auto"
            imgClassName="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          />

          <span
            className="absolute top-4 left-4 inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase shadow-sm"
            style={{ backgroundColor: accent, color: onAccent }}
          >
            {campaign.isFeatured ? "Featured event" : "Campaign"}
          </span>

          {timing?.urgent && (
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-sm">
              <Clock className="size-3.5" aria-hidden />
              {timing.label}
            </span>
          )}
        </div>

        {/* Pitch. Generous padding and a left rhythm of label → values, as in the reference. */}
        <div className="flex min-w-0 flex-col gap-5 p-6 sm:p-8 lg:p-10">
          <div className="min-w-0">
            <h3 className="text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">
              {campaign.title}
            </h3>
            {campaign.subtitle && (
              <p className="mt-1.5 line-clamp-2 text-sm text-muted">{campaign.subtitle}</p>
            )}
          </div>

          {campaign.description && (
            <p className="line-clamp-3 text-sm leading-6 text-muted">{campaign.description}</p>
          )}

          {(range || (timing && !timing.urgent)) && (
            <div className="space-y-2">
              <FieldLabel>When</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {range && <Pill icon={<CalendarRange className="size-3.5 text-muted" aria-hidden />}>{range}</Pill>}
                {timing && !timing.urgent && (
                  <Pill icon={<Clock className="size-3.5 text-muted" aria-hidden />}>{timing.label}</Pill>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <FieldLabel>What&apos;s inside</FieldLabel>
            <div className="flex flex-wrap gap-2">
              <Pill icon={<Package className="size-3.5 text-muted" aria-hidden />}>
                {campaign.productCount > 0
                  ? `${campaign.productCount} ${campaign.productCount === 1 ? "product" : "products"}`
                  : "Products arriving"}
              </Pill>
              <Pill icon={<Store className="size-3.5 text-muted" aria-hidden />}>ODOS vendors</Pill>
            </div>
          </div>

          <span
            className="mt-auto inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
            style={{ backgroundColor: accent, color: onAccent }}
          >
            Shop the campaign
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
