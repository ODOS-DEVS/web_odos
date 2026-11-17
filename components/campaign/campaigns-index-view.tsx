"use client";

import Link from "next/link";
import { ArrowRight, Clock, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { useCampaigns } from "@/hooks/use-catalog";
import { campaignTiming } from "@/libs/campaign-timing";
import { trackPromoClick, usePromoImpression } from "@/libs/promo-analytics";
import type { Campaign } from "@/types/catalog";

/** Every live campaign; scheduling and visibility are decided server-side. */
export function CampaignsIndexView() {
  const campaigns = useCampaigns();

  if (campaigns.isPending) {
    return (
      <Container className="py-10">
        <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
      </Container>
    );
  }
  if (campaigns.isError) {
    return (
      <Container className="py-10">
        <QueryError error={campaigns.error} onRetry={() => campaigns.refetch()} />
      </Container>
    );
  }

  const rows = campaigns.data ?? [];

  return (
    <Container className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">Campaigns</h1>
        <p className="mt-2 max-w-xl text-muted">Shopping events running on ODOS right now.</p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-10 text-muted" aria-hidden />}
          title="No campaigns running"
          description="Seasonal sales and shopping events will appear here when they go live."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {rows.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </Container>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  usePromoImpression("campaign", campaign.id, "campaigns");
  const timing = campaignTiming(campaign);
  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      onClick={() => trackPromoClick("campaign", campaign.id, "campaigns")}
      className="press group overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div className="relative">
        {/* Fixed aspect rather than a fixed height, so a banner is never squashed or cropped
            differently at one breakpoint than another. */}
        <Media
          src={campaign.bannerImageUrl ?? campaign.thumbnailImageUrl}
          name={campaign.title}
          sizes="(min-width: 640px) 50vw, 100vw"
          className="aspect-[16/7] w-full"
        />
        {timing && (
          <span className="absolute top-3 left-3">
            <Badge tone={timing.urgent ? "danger" : "neutral"}>
              <Clock className="size-3.5" aria-hidden />
              {timing.label}
            </Badge>
          </span>
        )}
        {campaign.isFeatured && (
          <span className="absolute top-3 right-3">
            <Badge tone="accent">Featured</Badge>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{campaign.title}</p>
          {campaign.subtitle && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{campaign.subtitle}</p>}
          <p className="mt-1 text-xs text-muted">
            {campaign.productCount} {campaign.productCount === 1 ? "product" : "products"}
            {timing && !timing.urgent && ` · ${timing.label}`}
          </p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
    </Link>
  );
}
