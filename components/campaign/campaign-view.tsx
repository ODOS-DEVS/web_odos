"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Clock, Package, SearchX, Store as StoreIcon } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { SearchInput } from "@/components/vendor/vendor-ui";
import { campaignTiming } from "@/libs/campaign-timing";
import { cn } from "@/libs/cn";
import { inkFor } from "@/libs/contrast";
import { useCampaign, useStoreMap } from "@/hooks/use-catalog";
import type { Product } from "@/types/catalog";

const DATE = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long" });

const SORTS = {
  featured: "Featured",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  discount: "Biggest discount",
} as const;

type SortKey = keyof typeof SORTS;

const discountOf = (product: Product) =>
  product.compareAtPrice && product.compareAtPrice > product.price
    ? 1 - product.price / product.compareAtPrice
    : 0;

/**
 * One campaign's own page, addressed by its slug.
 *
 * Everything on it comes from that campaign's record — its artwork, its accent, its dates and
 * the products the backend resolved for it. Nothing is keyed off the campaign's name or its
 * position in a list, so a new campaign needs no code to get a working page.
 *
 * Only approved products ever arrive here: visibility, stock, publication and nomination
 * approval are all decided server-side, and this view does not second-guess them.
 */
export function CampaignView({ slug }: { slug: string }) {
  const campaign = useCampaign(slug);
  const { map: stores } = useStoreMap();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [storeId, setStoreId] = useState<string | null>(null);

  const products = campaign.data?.products;

  const vendors = useMemo(() => {
    if (!products) return [];
    const ids = [...new Set(products.map((p) => p.storeId).filter(Boolean) as string[])];
    return ids
      .map((id) => ({ id, name: stores.get(id)?.name ?? null }))
      .filter((entry): entry is { id: string; name: string } => Boolean(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, stores]);

  const visible = useMemo(() => {
    if (!products) return [];
    const needle = query.trim().toLowerCase();
    let rows = products;
    if (needle) rows = rows.filter((p) => p.name.toLowerCase().includes(needle));
    if (storeId) rows = rows.filter((p) => p.storeId === storeId);

    const sorted = [...rows];
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "discount") sorted.sort((a, b) => discountOf(b) - discountOf(a));
    // "featured" keeps the backend's own order, which already honours pins and the
    // campaign's configured sort.
    return sorted;
  }, [products, query, sort, storeId]);

  if (campaign.isError) {
    return (
      <Container className="py-12">
        <QueryError error={campaign.error} onRetry={() => campaign.refetch()} title="We couldn’t load this campaign" />
      </Container>
    );
  }

  if (!campaign.data) {
    return (
      <Container className="py-8 sm:py-12">
        <div className="h-72 animate-pulse rounded-[1.75rem] bg-surface-muted" aria-busy="true" />
        <ProductGridSkeleton className="mt-8 lg:grid-cols-4" count={8} />
      </Container>
    );
  }

  const detail = campaign.data;
  const timing = campaignTiming(detail);
  const accent = detail.themeColor ?? "var(--accent)";
  const ink = inkFor(detail.themeColor);
  const onAccent = detail.themeColor ? (ink === "light" ? "#fff" : "#111827") : "var(--background)";
  // Read from the server's countdown rather than the browser clock: `secondsRemaining` is
  // computed against the campaign's real end, and a device with a wrong clock must not
  // declare a running campaign finished.
  const ended = Boolean(detail.endsAt) && detail.secondsRemaining === 0;

  return (
    <Container className="py-8 sm:py-12">
      {/* The same composition as the card the shopper clicked, so the page they land on is
          recognisably the thing they chose. */}
      <header className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
          <div className="relative">
            <Media
              src={detail.bannerImageUrl ?? detail.thumbnailImageUrl}
              name={detail.title}
              sizes="(min-width: 768px) 45vw, 100vw"
              priority
              className="aspect-[4/3] w-full sm:aspect-[16/10] md:h-full md:min-h-[20rem] md:aspect-auto"
              imgClassName="object-cover"
            />
            <span
              className="absolute top-4 left-4 inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase shadow-sm"
              style={{ backgroundColor: accent, color: onAccent }}
            >
              {ended ? "Ended" : detail.isFeatured ? "Featured event" : "Campaign"}
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-4 p-6 sm:p-8 lg:p-10">
            <div>
              <h1 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
                {detail.title}
              </h1>
              {detail.subtitle && <p className="mt-2 text-sm text-muted">{detail.subtitle}</p>}
            </div>

            {detail.description && (
              <p className="text-sm leading-6 text-muted">{detail.description}</p>
            )}

            <div className="mt-auto flex flex-wrap gap-2">
              <Fact icon={<Package className="size-3.5 text-muted" aria-hidden />}>
                {detail.productCount} {detail.productCount === 1 ? "product" : "products"}
              </Fact>
              {vendors.length > 0 && (
                <Fact icon={<StoreIcon className="size-3.5 text-muted" aria-hidden />}>
                  {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}
                </Fact>
              )}
              {detail.endsAt && (
                <Fact icon={<CalendarRange className="size-3.5 text-muted" aria-hidden />}>
                  {ended ? "Ended" : "Until"} {DATE.format(new Date(detail.endsAt))}
                </Fact>
              )}
              {timing && !ended && (
                <Fact icon={<Clock className="size-3.5 text-muted" aria-hidden />}>{timing.label}</Fact>
              )}
            </div>
          </div>
        </div>
      </header>

      {ended && (
        <p className="mt-6 rounded-2xl border border-line bg-surface-muted px-5 py-4 text-sm text-muted">
          This event has finished. Products below are back at their usual prices.
        </p>
      )}

      {detail.products.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={`Search ${detail.title}`}
            label={`Search products in ${detail.title}`}
            icon={<SearchX className="size-4" aria-hidden />}
          />
          <select
            value={storeId ?? ""}
            onChange={(event) => setStoreId(event.target.value || null)}
            aria-label="Filter by vendor"
            className="h-11 rounded-full border border-line bg-surface px-4 text-sm"
          >
            <option value="">All vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label="Sort products"
            className="h-11 rounded-full border border-line bg-surface px-4 text-sm"
          >
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-8">
        {visible.length > 0 ? (
          <ProductGrid products={visible} stores={stores} columns={4} scrollOnMobile={false} />
        ) : detail.products.length > 0 ? (
          <EmptyState
            icon={<SearchX className="size-10 text-muted" aria-hidden />}
            title="Nothing matches that"
            description="Try a different search, or clear the vendor filter."
          />
        ) : (
          <EmptyState
            icon={<SearchX className="size-10 text-muted" aria-hidden />}
            title="Nothing in this campaign yet"
            description="Vendors are still submitting products, and each one is reviewed before it appears here."
          />
        )}
      </div>
    </Container>
  );
}

function Fact({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold")}>
      {icon}
      {children}
    </span>
  );
}
