"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Check, Megaphone, Search } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { PageHeader, Panel, PanelHeader, SearchInput, SkeletonRows } from "@/components/vendor/vendor-ui";
import { campaignTiming } from "@/libs/campaign-timing";
import { cn } from "@/libs/cn";
import { inkFor } from "@/libs/contrast";
import { formatDate } from "@/libs/format";
import { useCampaignOptIns, useOpenCampaigns, useOptInToCampaign } from "@/hooks/use-vendor-store";
import { useVendorProducts } from "@/hooks/use-vendor";
import type { Campaign } from "@/types/catalog";
import type { MerchandisingOptIn, VendorProduct } from "@/types/vendor";

const TONE: Record<string, BadgeTone> = { approved: "success", pending: "warning", rejected: "danger" };

/**
 * Campaigns are ODOS-run merchandising slots (a themed row on the homepage, say). A vendor puts
 * products forward and ODOS reviews each one — there is no vendor-created campaign in this API.
 *
 * The nomination endpoint takes a single product per call, so nominating several fires one request
 * each. Partial failure is real and is reported as such rather than rolled up into one "done".
 */
export function CampaignsView() {
  const campaigns = useOpenCampaigns();
  const optIns = useCampaignOptIns();
  const products = useVendorProducts();
  const optIn = useOptInToCampaign();

  const [nominating, setNominating] = useState<Campaign | null>(null);

  if (campaigns.isError) {
    return <QueryError title="We couldn't load campaigns" error={campaigns.error} onRetry={() => campaigns.refetch()} />;
  }

  const open = campaigns.data ?? [];
  const mine = optIns.data ?? [];

  /** Entries grouped by campaign, so each card can show what the vendor already has in it. */
  const byCampaign = new Map<string, MerchandisingOptIn[]>();
  for (const entry of mine) {
    const bucket = byCampaign.get(entry.campaignId);
    if (bucket) bucket.push(entry);
    else byCampaign.set(entry.campaignId, [entry]);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campaigns"
        description="Put products forward for an ODOS merchandising campaign. Each entry is reviewed before it runs."
      />

      {campaigns.isPending ? (
        <SkeletonRows count={2} />
      ) : open.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-10 text-muted" aria-hidden />}
          title="No campaigns open right now"
          description="When ODOS opens a campaign for entries it shows up here, and you can nominate products for it."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {open.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              entries={byCampaign.get(campaign.id) ?? []}
              products={products.data ?? []}
              onNominate={() => setNominating(campaign)}
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

      {nominating && (
        <NominateDrawer
          campaign={nominating}
          products={products.data ?? []}
          entries={byCampaign.get(nominating.id) ?? []}
          pending={optIn.isPending}
          onClose={() => setNominating(null)}
          onSubmit={async (productIds) => {
            // One request per product. Settled, not `all`, so one rejection doesn't hide the rest.
            const results = await Promise.allSettled(
              productIds.map((productId) => optIn.mutateAsync({ campaignId: nominating.id, productId })),
            );
            const failed = results.filter((r) => r.status === "rejected").length;
            const sent = results.length - failed;

            if (sent > 0) {
              toast.success(
                sent === 1
                  ? `1 product entered into ${nominating.title}`
                  : `${sent} products entered into ${nominating.title}`,
              );
            }
            if (failed > 0) {
              const first = results.find((r) => r.status === "rejected");
              const reason = first && first.status === "rejected" ? first.reason : null;
              toast.error(
                `${failed} ${failed === 1 ? "product" : "products"} couldn't be entered. ${
                  reason instanceof Error ? reason.message : ""
                }`.trim(),
              );
            }
            if (failed === 0) setNominating(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * The campaign as the vendor will see it on the storefront — same artwork, same accent — so the
 * decision to nominate is made against the real slot rather than a title in a list.
 */
function CampaignCard({
  campaign,
  entries,
  products,
  onNominate,
}: {
  campaign: Campaign;
  entries: MerchandisingOptIn[];
  products: VendorProduct[];
  onNominate: () => void;
}) {
  const timing = campaignTiming(campaign);
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
            {timing ? ` · ${timing.label}` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {campaign.description && <p className="text-sm text-muted">{campaign.description}</p>}
        {(campaign.startsAt || campaign.endsAt) && (
          <p className="text-xs text-muted">
            {campaign.startsAt && `Runs ${formatDate(campaign.startsAt)}`}
            {campaign.endsAt && ` until ${formatDate(campaign.endsAt)}`}
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
          <Button type="button" onClick={onNominate} disabled={products.length === 0}>
            {entries.length > 0 ? "Nominate more" : "Nominate products"}
          </Button>
          <ButtonLink href={`/campaigns/${campaign.slug}`} variant="outline" target="_blank" rel="noopener noreferrer">
            View page
            <ArrowUpRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>

        {products.length === 0 && (
          <p className="text-xs text-muted">Add a product to your store first — there is nothing to nominate yet.</p>
        )}
      </div>
    </Panel>
  );
}

/** Multi-select product picker. Products already in the campaign are shown with their status, not hidden. */
function NominateDrawer({
  campaign,
  products,
  entries,
  pending,
  onClose,
  onSubmit,
}: {
  campaign: Campaign;
  products: VendorProduct[];
  entries: MerchandisingOptIn[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (productIds: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const entered = useMemo(
    () => new Map(entries.filter((e) => e.productId).map((e) => [e.productId as string, e.status])),
    [entries],
  );

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const live = products.filter((p) => p.status === "active");
    if (!needle) return live;
    return live.filter((p) => p.name.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle));
  }, [products, query]);

  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  return (
    <Drawer open onClose={onClose} title={`Nominate for ${campaign.title}`} labelId="nominate-campaign">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-line px-5 py-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search your products"
            label="Search your products"
            icon={<Search className="size-4" aria-hidden />}
          />
          <p className="mt-2 text-xs text-muted">
            Only active products can be nominated. ODOS reviews each one before it appears in the campaign.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {matches.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              {query.trim() ? "No products match that search." : "You have no active products to nominate."}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {matches.map((product) => {
                const status = entered.get(product.id);
                const isPicked = picked.includes(product.id);
                return (
                  <li key={product.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-5 py-3",
                        status && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isPicked}
                        disabled={Boolean(status)}
                        onChange={() => toggle(product.id)}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-md border",
                          isPicked ? "border-accent bg-accent text-white" : "border-line",
                        )}
                      >
                        {isPicked && <Check className="size-3.5" />}
                      </span>
                      <Media src={product.imageUrl} name={product.name} className="size-11 shrink-0 rounded-lg" sizes="44px" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{product.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          GHS {product.price.toLocaleString()} · {product.availableStock} in stock
                        </span>
                      </span>
                      {status && <Badge tone={TONE[status] ?? "neutral"}>{status}</Badge>}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-5 py-4">
          <Button
            type="button"
            className="w-full"
            disabled={picked.length === 0 || pending}
            onClick={() => onSubmit(picked)}
          >
            {pending
              ? "Entering…"
              : picked.length === 0
                ? "Choose products to nominate"
                : `Nominate ${picked.length} ${picked.length === 1 ? "product" : "products"}`}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
