"use client";

import { TrackEvent } from "@/components/tracking/track";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { ProductFilters, type ActiveFilters } from "@/components/product/product-filters";
import { FilterChip } from "@/components/product/filter-chip";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import {
  useCampaignProducts,
  useCampaigns,
  useCategories,
  useProductSearch,
  useStores,
} from "@/hooks/use-catalog";
import { filterProducts, type ProductSort } from "@/libs/catalog";
import { buildHref } from "@/libs/url";
import { catalogQueries } from "@/services/queries";
import type { ProductTag } from "@/types/catalog";

export const SORTS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export const TAGS: ProductTag[] = ["new", "popular", "flash"];
const TAG_TITLE: Record<ProductTag, string> = { new: "New arrivals", popular: "Popular products", flash: "Flash deals" };

const humanise = (slug: string) => slug.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/**
 * Product listing. Where the results come from depends on the URL:
 * - `?q=` → `/catalog/search` (ranked by relevance; "Featured" keeps that order);
 * - `?campaign=` → `/catalog/deal-products?campaign_tag=…`;
 * - otherwise → `/catalog/products` (the API caps one page at 100).
 * Category, store, tag, delivery and sort filters are then applied in memory.
 */
export function ProductsView({ filters }: { filters: ActiveFilters }) {
  const search = useProductSearch(filters.q);
  const campaignProducts = useCampaignProducts(filters.q ? undefined : filters.campaign);
  // Only fetch the full catalogue when it is the actual source of the results.
  const catalogue = useQuery({ ...catalogQueries.products(), enabled: !filters.q && !filters.campaign });
  const stores = useStores();
  const categories = useCategories();
  const campaigns = useCampaigns();

  const source = filters.q ? search : filters.campaign ? campaignProducts : catalogue;

  const sort = SORTS.some((s) => s.value === filters.sort) ? (filters.sort as ProductSort) : "featured";
  const tag = TAGS.includes(filters.tag as ProductTag) ? (filters.tag as ProductTag) : undefined;

  const storeList = useMemo(() => stores.data ?? [], [stores.data]);
  const storeMap = useMemo(() => new Map(storeList.map((s) => [s.id, s])), [storeList]);
  const results = useMemo(
    () =>
      filterProducts(source.data ?? [], storeList, {
        // The search endpoint already matched the text; don't filter it out again client-side.
        q: undefined,
        category: filters.category,
        store: filters.store,
        tag,
        freeDelivery: Boolean(filters.free),
        sort,
      }),
    [source.data, storeList, filters.category, filters.store, filters.free, tag, sort],
  );

  const campaignTitle = filters.campaign
    ? (campaigns.data?.find((c) => c.slug === filters.campaign)?.title ?? humanise(filters.campaign))
    : undefined;

  const title = filters.q
    ? `Results for “${filters.q}”`
    : (categories.data?.find((c) => c.slug === filters.category)?.name ??
      (filters.store ? `Products from ${storeList.find((s) => s.slug === filters.store)?.name ?? "this store"}` : undefined) ??
      campaignTitle ??
      (tag ? TAG_TITLE[tag] : "All products"));

  const sortHref = (value: ProductSort) => buildHref("/products", filters, { sort: value === "featured" ? undefined : value });

  return (
    <Container className="py-8 sm:py-12">
      {filters.q && <TrackEvent event_type="search" search_query={filters.q} source_screen="products" />}
      {filters.category && !filters.q && <TrackEvent event_type="category_view" category={filters.category} source_screen="products" />}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted" aria-live="polite">
          {source.isPending ? "Loading…" : `${results.length} ${results.length === 1 ? "product" : "products"}`}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
        <div className="lg:sticky lg:top-40 lg:self-start">
          <ProductFilters active={filters} categories={categories.data ?? []} stores={storeList} />
        </div>

        <section aria-label="Results">
          <div className="no-scrollbar -mx-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <span className="shrink-0 text-sm text-muted">Sort by</span>
            {SORTS.map((option) => (
              <FilterChip key={option.value} href={sortHref(option.value)} active={sort === option.value}>
                {option.label}
              </FilterChip>
            ))}
          </div>

          {source.isPending ? (
            <ProductGridSkeleton className="lg:grid-cols-3" scrollOnMobile={false} />
          ) : source.isError ? (
            <QueryError error={source.error} onRetry={() => source.refetch()} title="We couldn’t load products" />
          ) : results.length > 0 ? (
            <ProductGrid products={results} stores={storeMap} columns={3} scrollOnMobile={false} />
          ) : (
            <EmptyState
              icon={<SearchX className="size-10 text-muted" aria-hidden />}
              title={filters.q ? `No results for “${filters.q}”` : "Nothing matches those filters"}
              description="Try removing a filter or searching for something else."
              action={<ButtonLink href="/products">Clear all filters</ButtonLink>}
            />
          )}
        </section>
      </div>
    </Container>
  );
}
