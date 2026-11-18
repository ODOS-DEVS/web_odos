"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Media } from "@/components/ui/media";
import { campaignTiming } from "@/libs/campaign-timing";
import { cn } from "@/libs/cn";
import { inkFor } from "@/libs/contrast";
import { trackPromoClick, usePromoImpression } from "@/libs/promo-analytics";
import type { Campaign } from "@/types/catalog";

/**
 * A campaign as a split card: artwork on the left, the pitch on the right.
 *
 * The eyebrow pill sits over the artwork rather than above the card, so the campaign's own
 * identity reads before its title does. Ink on the content panel is derived from the campaign's
 * theme colour, because that colour is chosen per campaign and a fixed white would be
 * unreadable on a pale one.
 *
 * Fixed aspect on the image and a line-clamped title keep every card the same height in a row —
 * a campaign with a long name must not make its neighbours taller.
 */
export function CampaignCard({
  campaign,
  source = "home",
  className,
}: {
  campaign: Campaign;
  source?: string;
  className?: string;
}) {
  usePromoImpression("campaign", campaign.id, source);
  const timing = campaignTiming(campaign);
  const ink = inkFor(campaign.themeColor);
  const tinted = Boolean(campaign.themeColor);

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      onClick={() => trackPromoClick("campaign", campaign.id, source)}
      className={cn(
        "press group grid h-full grid-cols-1 overflow-hidden rounded-3xl border border-line bg-surface sm:grid-cols-2",
        "transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <div className="relative">
        <Media
          src={campaign.bannerImageUrl ?? campaign.thumbnailImageUrl}
          name={campaign.title}
          sizes="(min-width: 640px) 22rem, 90vw"
          className="aspect-[4/3] w-full sm:h-full sm:aspect-auto"
          imgClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />

        {/* Eyebrow over the artwork, as in the reference. */}
        <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-surface/90 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm backdrop-blur-sm">
          {campaign.isFeatured ? "Featured" : "Campaign"}
        </span>

        {timing && (
          <span
            className={cn(
              "absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm",
              timing.urgent ? "bg-danger text-white" : "bg-surface/90 text-foreground",
            )}
          >
            <Clock className="size-3" aria-hidden />
            {timing.label}
          </span>
        )}
      </div>

      <div
        className={cn("flex min-w-0 flex-col p-5 sm:p-6", ink === "light" ? "text-white" : "text-foreground")}
        style={campaign.themeColor ? { backgroundColor: campaign.themeColor } : undefined}
      >
        <h3 className="line-clamp-2 text-lg font-bold tracking-tight sm:text-xl">{campaign.title}</h3>

        {campaign.subtitle && (
          <p
            className={cn(
              "mt-1.5 line-clamp-2 text-sm leading-6",
              ink === "light" ? "text-white/75" : "text-muted",
            )}
          >
            {campaign.subtitle}
          </p>
        )}

        <p className={cn("mt-3 text-xs", ink === "light" ? "text-white/70" : "text-muted")}>
          {campaign.productCount > 0
            ? `${campaign.productCount} ${campaign.productCount === 1 ? "product" : "products"} in this campaign`
            : "Products arriving soon"}
        </p>

        <span
          className={cn(
            "mt-auto inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 pt-2 text-sm font-semibold transition-colors",
            tinted && ink === "light"
              ? "bg-white/15 text-white group-hover:bg-white/25"
              : "bg-foreground text-background group-hover:opacity-85",
          )}
        >
          Shop the campaign
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
