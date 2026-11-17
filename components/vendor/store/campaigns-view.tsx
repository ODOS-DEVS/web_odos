"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { QueryError } from "@/components/ui/query-error";
import { PageHeader, Panel, PanelHeader, SkeletonRows } from "@/components/vendor/vendor-ui";
import { formatDate } from "@/libs/format";
import { useCampaignOptIns, useOpenCampaigns, useOptInToCampaign } from "@/hooks/use-vendor-store";
import { useVendorProducts } from "@/hooks/use-vendor";

const TONE: Record<string, BadgeTone> = { approved: "success", pending: "warning", rejected: "danger" };

/**
 * Campaigns are ODOS-run merchandising slots (a themed row on the homepage, say). A vendor opts
 * a product in and ODOS reviews it — there is no vendor-created campaign in this API.
 */
export function CampaignsView() {
  const campaigns = useOpenCampaigns();
  const optIns = useCampaignOptIns();
  const products = useVendorProducts();
  const optIn = useOptInToCampaign();

  const [picks, setPicks] = useState<Record<string, string>>({});

  if (campaigns.isError) {
    return <QueryError title="We couldn't load campaigns" error={campaigns.error} onRetry={() => campaigns.refetch()} />;
  }

  const open = campaigns.data ?? [];
  const mine = optIns.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campaigns"
        description="Put a product forward for an ODOS merchandising campaign. Each entry is reviewed before it runs."
      />

      {campaigns.isPending ? (
        <SkeletonRows count={2} />
      ) : open.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-10 text-muted" aria-hidden />}
          title="No campaigns open right now"
          description="When ODOS opens a campaign for entries it shows up here, and you can nominate a product for it."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {open.map((campaign) => (
            <Panel key={campaign.id}>
              <PanelHeader title={campaign.title} />
              <div className="space-y-3 p-5">
                {campaign.description && <p className="text-sm text-muted">{campaign.description}</p>}
                {(campaign.startsAt || campaign.endsAt) && (
                  <p className="text-xs text-muted">
                    {campaign.startsAt && `Runs ${formatDate(campaign.startsAt)}`}
                    {campaign.endsAt && ` until ${formatDate(campaign.endsAt)}`}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <select
                    className={`${inputClass} min-w-0 flex-1`}
                    aria-label={`Product to enter into ${campaign.title}`}
                    value={picks[campaign.id] ?? ""}
                    onChange={(e) => setPicks((p) => ({ ...p, [campaign.id]: e.target.value }))}
                  >
                    <option value="">Choose a product</option>
                    {products.data?.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    disabled={!picks[campaign.id] || optIn.isPending}
                    onClick={() =>
                      optIn.mutate(
                        { campaignId: campaign.id, productId: picks[campaign.id] },
                        {
                          onSuccess: () => {
                            toast.success(`Entered into ${campaign.title}`);
                            setPicks((p) => ({ ...p, [campaign.id]: "" }));
                          },
                          onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't enter that campaign."),
                        },
                      )
                    }
                  >
                    Enter
                  </Button>
                </div>
              </div>
            </Panel>
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.campaignTitle ?? "Campaign"}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {product?.name ?? entry.productId} · entered {formatDate(entry.createdAt)}
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
