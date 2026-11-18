"use client";

import { Megaphone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { CampaignCard } from "@/components/home/campaign-card";
import { useCampaigns } from "@/hooks/use-catalog";

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
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {rows.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} source="campaigns" />
          ))}
        </div>
      )}
    </Container>
  );
}

