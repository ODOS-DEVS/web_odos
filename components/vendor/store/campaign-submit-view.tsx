"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CircleAlert,
  Percent,
  Search,
  Tag,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { Panel, PanelHeader, SearchInput, SkeletonRows } from "@/components/vendor/vendor-ui";
import { cn } from "@/libs/cn";
import { formatDate, formatMoney } from "@/libs/format";
import { inkFor } from "@/libs/contrast";
import { useCampaignWorkspace, useSubmitCampaignProducts } from "@/hooks/use-vendor-store";
import { useVendorProducts } from "@/hooks/use-vendor";
import type { CampaignBrief, VendorProduct } from "@/types/vendor";

const TONE: Record<string, BadgeTone> = { approved: "success", pending: "warning", rejected: "danger" };

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

const discountPercent = (from: number, to: number) =>
  from > 0 && to > 0 && to < from ? Math.round((1 - to / from) * 100) : 0;

type Draft = { price: string };

/**
 * One campaign's submission workspace.
 *
 * The vendor's own products are fetched with their own token and never filtered client-side
 * from a wider catalogue, so there is nothing here that could show another store's stock. The
 * API re-checks ownership on every item regardless — this screen is the convenience, not the
 * control.
 *
 * Products already submitted stay visible with their review status rather than disappearing:
 * a vendor coming back to check on a nomination should not have to guess whether it was sent.
 */
export function CampaignSubmitView({ slug }: { slug: string }) {
  const workspace = useCampaignWorkspace(slug);
  const products = useVendorProducts();
  const submit = useSubmitCampaignProducts(slug);

  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Record<string, Draft>>({});

  const campaign = workspace.data?.campaign;
  // Memoised off the query data itself: `?? []` would be a fresh array each render and would
  // invalidate every dependent memo below it.
  const submissions = useMemo(() => workspace.data?.submissions ?? [], [workspace.data]);

  const submittedIds = useMemo(
    () => new Map(submissions.map((entry) => [entry.productId, entry.status])),
    [submissions],
  );

  const matches = useMemo(() => {
    const rows = (products.data ?? []).filter((p) => p.status === "active");
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (p) => p.name.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle),
    );
  }, [products.data, query]);

  if (workspace.isError) {
    return (
      <div className="space-y-5">
        <BackLink />
        <QueryError
          title="We couldn't open this campaign"
          error={workspace.error}
          onRetry={() => workspace.refetch()}
        />
      </div>
    );
  }

  if (workspace.isPending || !campaign) {
    return (
      <div className="space-y-5">
        <BackLink />
        <SkeletonRows count={4} />
      </div>
    );
  }

  const pickedIds = Object.keys(picked);
  const closed = !campaign.acceptsSubmissions;

  const toggle = (product: VendorProduct) =>
    setPicked((current) => {
      if (current[product.id]) {
        return Object.fromEntries(Object.entries(current).filter(([id]) => id !== product.id));
      }
      // Pre-fill the smallest price that satisfies the campaign's discount floor, so the
      // common case is one click rather than mental arithmetic on every product.
      const floor = campaign.minDiscountPercent;
      const suggested = floor ? Math.floor((product.price * (100 - floor)) / 100) : "";
      return { ...current, [product.id]: { price: suggested ? String(suggested) : "" } };
    });

  const invalid = pickedIds.filter((id) => {
    if (!campaign.requiresProposedPrice) return false;
    const product = (products.data ?? []).find((p) => p.id === id);
    const price = Number(picked[id]?.price || 0);
    if (!product || !price) return true;
    if (price >= product.price) return true;
    return Boolean(
      campaign.minDiscountPercent && discountPercent(product.price, price) < campaign.minDiscountPercent,
    );
  });

  const onSubmit = () => {
    submit.mutate(
      pickedIds.map((id) => ({
        productId: id,
        proposedPrice: picked[id]?.price ? Number(picked[id].price) : null,
      })),
      {
        onSuccess: (result) => {
          if (result.submitted > 0) {
            toast.success(
              `${result.submitted} ${result.submitted === 1 ? "product" : "products"} submitted to ${campaign.title}`,
            );
          }
          // Each refusal is reported with its own reason: a vendor told only "3 of 5 failed"
          // has no way to act on it.
          for (const outcome of result.outcomes.filter((o) => !o.accepted)) {
            const name =
              (products.data ?? []).find((p) => p.id === outcome.productId)?.name ?? outcome.productId;
            toast.error(`${name}: ${outcome.detail ?? "couldn't be submitted"}`);
          }
          setPicked((current) => {
            const accepted = new Set(result.outcomes.filter((o) => o.accepted).map((o) => o.productId));
            return Object.fromEntries(Object.entries(current).filter(([id]) => !accepted.has(id)));
          });
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "We couldn't send that submission."),
      },
    );
  };

  return (
    <div className="space-y-5">
      <BackLink />
      <CampaignBrief campaign={campaign} />

      {closed && (
        <p className="flex items-start gap-2 rounded-2xl border border-line bg-surface-muted px-5 py-4 text-sm text-muted">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Submissions for this campaign have closed. Anything you already sent is still being
          reviewed and is listed below.
        </p>
      )}

      {!closed && (
        <Panel>
          <PanelHeader
            title="Your products"
            action={
              <span className="text-xs text-muted">
                {pickedIds.length > 0 ? `${pickedIds.length} selected` : "None selected"}
              </span>
            }
          />

          <div className="border-b border-line px-5 py-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search your products"
              label="Search your products"
              icon={<Search className="size-4" aria-hidden />}
            />
            <p className="mt-2 text-xs text-muted">
              Only active products can be submitted. ODOS reviews each one before it appears in the
              campaign — your normal price never changes.
            </p>
          </div>

          {products.isPending ? (
            <div className="p-5">
              <SkeletonRows count={3} />
            </div>
          ) : matches.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              {query.trim() ? "No products match that search." : "You have no active products to submit."}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {matches.map((product) => {
                const already = submittedIds.get(product.id);
                const draft = picked[product.id];
                const price = Number(draft?.price || 0);
                const off = price ? discountPercent(product.price, price) : 0;
                const belowFloor = Boolean(
                  campaign.minDiscountPercent && price && off < campaign.minDiscountPercent,
                );
                const tooHigh = Boolean(price && price >= product.price);

                return (
                  <li key={product.id} className="px-5 py-3.5">
                    <div className={cn("flex items-center gap-3", already && "opacity-60")}>
                      <button
                        type="button"
                        onClick={() => !already && toggle(product)}
                        disabled={Boolean(already)}
                        aria-pressed={Boolean(draft)}
                        aria-label={`Select ${product.name}`}
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                          draft ? "border-accent bg-accent text-white" : "border-line",
                          already && "cursor-not-allowed",
                        )}
                      >
                        {draft && <Check className="size-3.5" aria-hidden />}
                      </button>

                      <Media
                        src={product.imageUrl}
                        name={product.name}
                        className="size-12 shrink-0 rounded-lg"
                        sizes="48px"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {formatMoney(product.price)} · {product.availableStock} in stock
                        </p>
                      </div>

                      {already && <Badge tone={TONE[already] ?? "neutral"}>{already}</Badge>}
                    </div>

                    {draft && campaign.requiresProposedPrice && (
                      <div className="mt-3 ml-8 flex flex-wrap items-center gap-3 rounded-xl bg-surface-muted p-3">
                        <label className="flex items-center gap-2 text-xs font-medium">
                          <Tag className="size-3.5 text-muted" aria-hidden />
                          Campaign price
                          <input
                            className={cn(inputClass, "h-9 w-28 text-sm", (belowFloor || tooHigh) && "border-danger")}
                            inputMode="numeric"
                            value={draft.price}
                            aria-label={`Campaign price for ${product.name}`}
                            onChange={(event) =>
                              setPicked((current) => ({
                                ...current,
                                [product.id]: { price: digitsOnly(event.target.value) },
                              }))
                            }
                          />
                        </label>
                        <span className="text-xs text-muted">
                          was {formatMoney(product.price)}
                          {off > 0 && (
                            <span
                              className={cn(
                                "ml-2 inline-flex items-center gap-1 font-semibold",
                                belowFloor ? "text-danger" : "text-success",
                              )}
                            >
                              <Percent className="size-3" aria-hidden />
                              {off}% off
                            </span>
                          )}
                        </span>
                        {tooHigh && (
                          <span className="text-xs text-danger">Must be below your current price.</span>
                        )}
                        {belowFloor && !tooHigh && (
                          <span className="text-xs text-danger">
                            This campaign needs at least {campaign.minDiscountPercent}% off.
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-line px-5 py-4">
            <Button
              type="button"
              className="w-full"
              disabled={pickedIds.length === 0 || invalid.length > 0 || submit.isPending}
              onClick={onSubmit}
            >
              {submit.isPending
                ? "Submitting…"
                : pickedIds.length === 0
                  ? "Choose products to submit"
                  : invalid.length > 0
                    ? `${invalid.length} ${invalid.length === 1 ? "price needs" : "prices need"} fixing`
                    : `Submit ${pickedIds.length} ${pickedIds.length === 1 ? "product" : "products"}`}
            </Button>
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader title={`Already submitted (${submissions.length})`} />
        {submissions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Tag className="size-10 text-muted" aria-hidden />}
              title="Nothing submitted yet"
              description="Products you submit to this campaign appear here with their review status."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {submissions.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-5 py-4">
                <Media
                  src={entry.productImageUrl}
                  name={entry.productTitle}
                  className="size-12 shrink-0 rounded-lg"
                  sizes="48px"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.productTitle}</p>
                  <p className="mt-0.5 text-xs text-muted">Submitted {formatDate(entry.createdAt)}</p>
                  {entry.proposedPrice !== null && (
                    <p className="mt-1 text-xs">
                      <span className="font-semibold">{formatMoney(entry.proposedPrice)}</span>
                      {entry.proposedOldPrice !== null && (
                        <span className="ml-1.5 text-muted line-through">
                          {formatMoney(entry.proposedOldPrice)}
                        </span>
                      )}
                      {entry.discountPercent !== null && (
                        <span className="ml-2 text-muted">{entry.discountPercent}% off</span>
                      )}
                    </p>
                  )}
                  {entry.reviewNotes && (
                    <p className="mt-1 text-xs text-muted">ODOS said: {entry.reviewNotes}</p>
                  )}
                </div>
                <Badge tone={TONE[entry.status] ?? "neutral"}>{entry.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/seller/campaigns"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All campaigns
    </Link>
  );
}

/** The brief, so a vendor can see what they are submitting to without leaving the page. */
function CampaignBrief({ campaign }: { campaign: CampaignBrief }) {
  const ink = inkFor(campaign.themeColor);

  return (
    <Panel className="overflow-hidden">
      <div
        className={cn("flex flex-wrap gap-4 p-5", ink === "light" ? "text-white" : "text-neutral-900")}
        style={{ backgroundColor: campaign.themeColor ?? "var(--surface-muted)" }}
      >
        <Media
          src={campaign.thumbnailImageUrl ?? campaign.bannerImageUrl}
          name={campaign.title}
          className="size-24 shrink-0 rounded-xl"
          sizes="96px"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight">{campaign.title}</h1>
          {campaign.subtitle && <p className="mt-1 text-sm opacity-80">{campaign.subtitle}</p>}
          {campaign.description && (
            <p className="mt-2 line-clamp-2 text-sm opacity-75">{campaign.description}</p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-line border-t border-line sm:grid-cols-4">
        <Stat label="Submissions close" value={campaign.submissionClosesAt ? formatDate(campaign.submissionClosesAt) : "No deadline"} icon={<CalendarClock className="size-3.5" aria-hidden />} />
        <Stat label="Campaign runs" value={campaign.endsAt ? `Until ${formatDate(campaign.endsAt)}` : "Open-ended"} />
        <Stat
          label="Campaign price"
          value={campaign.requiresProposedPrice ? "Required" : "Optional"}
        />
        <Stat
          label="Minimum discount"
          value={campaign.minDiscountPercent ? `${campaign.minDiscountPercent}% off` : "None set"}
        />
      </dl>
    </Panel>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <dt className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] text-muted uppercase">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold">{value}</dd>
    </div>
  );
}
