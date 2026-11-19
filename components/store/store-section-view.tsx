"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, SearchX, SlidersHorizontal } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { SearchInput } from "@/components/vendor/vendor-ui";
import { StoreSectionNav } from "@/components/store/store-section-nav";
import { VerifiedBadge } from "@/components/store/verified-badge";
import { useStoreBySlug, useStoreSection, useStoreSections } from "@/hooks/use-catalog";
import type { Product } from "@/types/catalog";

const SORTS = {
  featured: "Featured",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Top rated",
  newest: "Newest",
} as const;

type SortKey = keyof typeof SORTS;

/** Shown in the price filter. Kept coarse on purpose: a slider is overkill for one shelf. */
const PRICE_BANDS = [
  { id: "all", label: "Any price", test: () => true },
  { id: "under-50", label: "Under 50", test: (p: Product) => p.price < 50 },
  { id: "50-200", label: "50 – 200", test: (p: Product) => p.price >= 50 && p.price <= 200 },
  { id: "200-500", label: "200 – 500", test: (p: Product) => p.price > 200 && p.price <= 500 },
  { id: "over-500", label: "Over 500", test: (p: Product) => p.price > 500 },
] as const;

/**
 * One shelf of one shop, as its own page.
 *
 * Fetches only this section rather than every shelf in the store, so a shop with twenty
 * sections does not pay for nineteen of them to render one. Searching, sorting and filtering
 * run over the section's own products — the shelf is a bounded set by definition, so there is
 * no second round trip for a filter change.
 *
 * Everything below the header is the marketplace's own `ProductGrid`, so cart, wishlist and
 * product links behave exactly as they do everywhere else.
 */
export function StoreSectionView({ slug, sectionSlug }: { slug: string; sectionSlug: string }) {
  const { data: store, isPending: storePending, isError: storeError, error, refetch } = useStoreBySlug(slug);
  const section = useStoreSection(store?.id, sectionSlug);
  const sections = useStoreSections(store?.id);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [band, setBand] = useState<(typeof PRICE_BANDS)[number]["id"]>("all");
  const [inStockOnly, setInStockOnly] = useState(false);

  const products = section.data?.products;

  const visible = useMemo(() => {
    if (!products) return [];
    const needle = query.trim().toLowerCase();
    const bandTest = PRICE_BANDS.find((b) => b.id === band)?.test ?? (() => true);

    let rows = products.filter((p) => bandTest(p));
    if (needle) rows = rows.filter((p) => p.name.toLowerCase().includes(needle));
    if (inStockOnly) rows = rows.filter((p) => p.stock > 0);

    const sorted = [...rows];
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    else if (sort === "newest") sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    // "featured" keeps the vendor's own order on the shelf.
    return sorted;
  }, [products, query, sort, band, inStockOnly]);

  if (storeError) {
    return (
      <Container className="py-12">
        <QueryError error={error} onRetry={() => refetch()} title="We couldn’t load this store" />
      </Container>
    );
  }
  if (section.isError) {
    return (
      <Container className="py-12">
        <QueryError error={section.error} onRetry={() => section.refetch()} title="We couldn’t load this section" />
      </Container>
    );
  }
  if (storePending || section.isPending || !store || !section.data) {
    return (
      <Container className="py-8 sm:py-12">
        <div className="h-40 animate-pulse rounded-3xl bg-surface-muted" aria-busy="true" />
        <ProductGridSkeleton className="mt-8 lg:grid-cols-4" count={8} />
      </Container>
    );
  }

  const detail = section.data;

  return (
    <Container className="py-6 sm:py-10">
      <Link
        href={`/stores/${store.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {store.name}
      </Link>

      <header className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          {detail.coverImageUrl && (
            <Media
              src={detail.coverImageUrl}
              name={detail.title}
              sizes="(min-width: 640px) 40vw, 100vw"
              priority
              className="aspect-[16/9] w-full sm:h-full sm:aspect-auto"
              imgClassName="object-cover"
            />
          )}
          <div className={detail.coverImageUrl ? "p-6 sm:p-8" : "p-6 sm:col-span-2 sm:p-8"}>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.1em] text-muted uppercase">
              {store.name}
              {store.isVerified && <VerifiedBadge size="sm" />}
            </p>
            <h1 className="mt-2 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">{detail.title}</h1>
            {detail.description && <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{detail.description}</p>}
            <p className="mt-3 text-sm text-muted">
              {detail.products.length} {detail.products.length === 1 ? "product" : "products"}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-6">
        <StoreSectionNav
          store={store}
          sections={sections.data ?? []}
          activeSlug={sectionSlug}
        />
      </div>

      {detail.products.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={`Search ${detail.title}`}
            label={`Search products in ${detail.title}`}
            icon={<SlidersHorizontal className="size-4" aria-hidden />}
          />
          <select
            value={band}
            onChange={(event) => setBand(event.target.value as typeof band)}
            aria-label="Filter by price"
            className="h-11 rounded-full border border-line bg-surface px-4 text-sm"
          >
            {PRICE_BANDS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
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
          <label className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
            />
            In stock only
          </label>
        </div>
      )}

      <div className="mt-8">
        {visible.length > 0 ? (
          <ProductGrid
            products={visible}
            stores={new Map([[store.id, store]])}
            columns={4}
            scrollOnMobile={false}
          />
        ) : detail.products.length > 0 ? (
          <EmptyState
            icon={<SearchX className="size-10 text-muted" aria-hidden />}
            title="Nothing matches that"
            description="Try a different search, or widen the price filter."
          />
        ) : (
          <EmptyState
            icon={<SearchX className="size-10 text-muted" aria-hidden />}
            title="This section is empty"
            description="The shop hasn't added anything here yet."
          />
        )}
      </div>
    </Container>
  );
}
