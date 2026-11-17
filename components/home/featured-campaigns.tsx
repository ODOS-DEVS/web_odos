"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Carousel } from "@/components/ui/carousel";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { SectionHeading } from "@/components/ui/section-heading";
import { campaignTiming } from "@/libs/campaign-timing";
import { cn } from "@/libs/cn";
import { inkFor } from "@/libs/contrast";
import { trackPromoClick, usePromoImpression } from "@/libs/promo-analytics";
import { useCampaigns } from "@/hooks/use-catalog";
import type { Campaign } from "@/types/catalog";

function CampaignTile({ campaign }: { campaign: Campaign }) {
  usePromoImpression("campaign", campaign.id, "home");
  const timing = campaignTiming(campaign);
  // The theme colour comes from whoever scheduled the campaign, so the ink is derived from it.
  const ink = inkFor(campaign.themeColor);

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      onClick={() => trackPromoClick("campaign", campaign.id, "home")}
      className="press group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div className="relative">
        <Media
          src={campaign.bannerImageUrl ?? campaign.thumbnailImageUrl}
          name={campaign.title}
          sizes="(min-width: 1024px) 24rem, 80vw"
          className="aspect-[16/9] w-full"
          imgClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />
        {timing && (
          <span className="absolute top-3 left-3">
            <Badge tone={timing.urgent ? "danger" : "neutral"}>
              <Clock className="size-3.5" aria-hidden />
              {timing.label}
            </Badge>
          </span>
        )}
      </div>

      <div
        className={cn("flex min-w-0 flex-1 flex-col p-4", ink === "light" ? "text-white" : "text-foreground")}
        style={campaign.themeColor ? { backgroundColor: campaign.themeColor } : undefined}
      >
        <h3 className="line-clamp-1 text-base font-semibold">{campaign.title}</h3>
        {campaign.subtitle && (
          <p className={cn("mt-1 line-clamp-2 text-sm", ink === "light" ? "text-white/75" : "text-muted")}>
            {campaign.subtitle}
          </p>
        )}
        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-medium">
          {campaign.productCount} {campaign.productCount === 1 ? "product" : "products"}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/**
 * Live campaigns as a scrollable row.
 *
 * A carousel rather than a grid because campaigns are a browse-and-pick list whose length the
 * team controls — a grid of eight would push the rest of the homepage below the fold. Featured
 * campaigns come first; the backend already excludes anything expired or unpublished.
 */
export function FeaturedCampaigns() {
  const { data, isPending, isError } = useCampaigns();

  if (isPending) {
    return (
      <Container>
        <div className="h-7 w-44 animate-pulse rounded-full bg-surface-muted" aria-busy="true" />
        <div className="mt-5 flex gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 w-80 shrink-0 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      </Container>
    );
  }

  // Nothing scheduled is a normal state, not an error worth a message.
  if (isError || !data?.length) return null;

  const ordered = [...data].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.displayPriority - a.displayPriority,
  );

  return (
    <Container>
      <SectionHeading
        title="Shopping events"
        description="Seasonal sales and collections running right now."
        href="/campaigns"
        hrefLabel="All campaigns"
      />
      <div className="mt-5">
        <Carousel label="Shopping events" itemClassName="w-[17rem] sm:w-[20rem]">
          {ordered.map((campaign) => (
            <CampaignTile key={campaign.id} campaign={campaign} />
          ))}
        </Carousel>
      </div>
    </Container>
  );
}
