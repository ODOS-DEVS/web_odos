"use client";

import { ArrowUpRight, CalendarClock, Megaphone, Package } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { PageHeader, Panel, PanelHeader, SkeletonRows } from "@/components/vendor/vendor-ui";
import { cn } from "@/libs/cn";
import { formatDate } from "@/libs/format";
import { inkFor } from "@/libs/contrast";
import { useCampaignOptIns, useOpenCampaigns } from "@/hooks/use-vendor-store";
import { useVendorProducts } from "@/hooks/use-vendor";
import type { CampaignBrief, MerchandisingOptIn } from "@/types/vendor";

const TONE: Record<string, BadgeTone> = { approved: "success", pending: "warning", rejected: "danger" };

/**
 * Campaigns a vendor can take part in.
 *
 * This page only lists and routes — nominating happens on each campaign's own submission page,
 * which is also where the invitation notification lands. Keeping one destination means a vendor
 * arriving from a notification and a vendor arriving from the menu see the same screen.
 */
export function CampaignsView() {
  const campaigns = useOpenCampaigns();
  const optIns = useCampaignOptIns();
  const products = useVendorProducts();

  if (campaigns.isError) {
    return <QueryError title="We couldn't load campaigns" error={campaigns.error} onRetry={() => campaigns.refetch()} />;
  }

  const open = campaigns.data ?? [];
  const mine = optIns.data ?? [];

  const counts = new Map<string, MerchandisingOptIn[]>();
  for (const entry of mine) {
    const bucket = counts.get(entry.campaignId);
    if (bucket) bucket.push(entry);
    else counts.set(entry.campaignId, [entry]);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campaigns"
        description="ODOS runs seasonal events and invites vendors to put products forward. Every entry is reviewed before it goes live."
      />

      {campaigns.isPending ? (
        <SkeletonRows count={2} />
      ) : open.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-10 text-muted" aria-hidden />}
          title="No campaigns open right now"
          description="When ODOS opens a campaign for entries you'll get a notification, and it will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {open.map((campaign) => (
            <CampaignRow
              key={campaign.id}
              campaign={campaign}
              entries={counts.get(campaign.id) ?? []}
            />
          ))}
        </div>
      )}

      <Panel>
        <PanelHeader title="Your entries" />
        {optIns.isPending ? (
          <div className="p-5">
            <SkeletonRows count={2} />
          </div>
        ) : mine.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">You haven&apos;t entered any campaigns yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {mine.map((entry) => {
              const product = products.data?.find((p) => p.id === entry.productId);
              return (
                <li key={entry.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Media
                    src={product?.imageUrl}
                    name={product?.name ?? entry.productId}
                    className="size-11 shrink-0 rounded-lg"
                    sizes="44px"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product?.name ?? entry.productId}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {entry.campaignTitle ?? "Campaign"} · entered {formatDate(entry.createdAt)}
                    </p>
                  </div>
                  <Badge tone={TONE[entry.status] ?? "neutral"}>{entry.status}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function CampaignRow({ campaign, entries }: { campaign: CampaignBrief; entries: MerchandisingOptIn[] }) {
  const ink = inkFor(campaign.themeColor);
  const approved = entries.filter((e) => e.status === "approved").length;
  const pending = entries.filter((e) => e.status === "pending").length;

  return (
    <Panel className="overflow-hidden">
      <div
        className={cn("flex gap-4 p-4", ink === "light" ? "text-white" : "text-neutral-900")}
        style={{ backgroundColor: campaign.themeColor ?? "var(--surface-muted)" }}
      >
        <Media
          src={campaign.thumbnailImageUrl ?? campaign.bannerImageUrl}
          name={campaign.title}
          className="size-20 shrink-0 rounded-xl"
          sizes="80px"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{campaign.title}</h3>
          {campaign.subtitle && <p className="mt-0.5 line-clamp-2 text-sm opacity-80">{campaign.subtitle}</p>}
          <p className="mt-1.5 text-xs opacity-75">
            {campaign.productCount} {campaign.productCount === 1 ? "product" : "products"} live
          </p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {campaign.submissionClosesAt && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <CalendarClock className="size-3.5" aria-hidden />
            Submissions close {formatDate(campaign.submissionClosesAt)}
          </p>
        )}

        {campaign.requiresProposedPrice && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Package className="size-3.5" aria-hidden />
            A campaign price is required
            {campaign.minDiscountPercent ? `, at least ${campaign.minDiscountPercent}% off` : ""}
          </p>
        )}

        {entries.length > 0 && (
          <p className="text-xs text-muted">
            You have {entries.length} {entries.length === 1 ? "entry" : "entries"} here
            {approved > 0 && ` · ${approved} approved`}
            {pending > 0 && ` · ${pending} awaiting review`}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <ButtonLink href={`/seller/campaigns/${campaign.slug}/submit`}>
            {entries.length > 0 ? "Submit more products" : "Submit products"}
          </ButtonLink>
          <ButtonLink
            href={`/campaigns/${campaign.slug}`}
            variant="outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View page
            <ArrowUpRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </Panel>
  );
}
