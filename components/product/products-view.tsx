"use client";

import { SearchX } from "lucide-react";
import { ProductFilters, type ActiveFilters } from "@/components/product/product-filters";
import { FilterChip } from "@/components/product/filter-chip";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { QueryError } from "@/components/ui/query-error";
import { filterProducts, type ProductSort } from "@/libs/catalog";
import { buildHref } from "@/libs/url";
import { MOCK_CATEGORIES, MOCK_STORES, mockProducts } from "@/mocks/catalog.mock";
import { fakeQuery } from "@/mocks/query";
import type { ProductTag } from "@/types/catalog";

export const SORTS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export const TAGS: ProductTag[] = ["new", "popular", "flash"];
const TAG_TITLE: Record<ProductTag, string> = { new: "New arrivals", popular: "Popular products", flash: "Flash deals" };

export function ProductsView({ filters }: { filters: ActiveFilters }) {
  const products = fakeQuery(mockProducts());
  const stores = fakeQuery(MOCK_STORES);
  const categories = fakeQuery(MOCK_CATEGORIES);

  const sort = SORTS.some((s) => s.value === filters.sort) ? (filters.sort as ProductSort) : "featured";
  const tag = TAGS.includes(filters.tag as ProductTag) ? (filters.tag as ProductTag) : undefined;

  const storeList = stores.data ?? [];
  const results = filterProducts(products.data ?? [], storeList, {
    q: filters.q,
    category: filters.category,
    store: filters.store,
    tag,
    freeDelivery: Boolean(filters.free),
    sort,
  });
  const storeMap = new Map(storeList.map((s) => [s.id, s]));

  const title = filters.q
    ? `Results for “${filters.q}”`
    : (categories.data?.find((c) => c.slug === filters.category)?.name ??
      (filters.store ? `Products from ${storeList.find((s) => s.slug === filters.store)?.name ?? "this store"}` : undefined) ??
      (tag ? TAG_TITLE[tag] : "All products"));

  const sortHref = (value: ProductSort) => buildHref("/products", filters, { sort: value === "featured" ? undefined : value });

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted" aria-live="polite">
          {products.isPending ? "Loading…" : `${results.length} ${results.length === 1 ? "product" : "products"}`}
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

          {products.isPending ? (
            <ProductGridSkeleton className="lg:grid-cols-3" />
          ) : products.isError ? (
            <QueryError error={products.error} onRetry={() => products.refetch()} title="We couldn’t load products" />
          ) : results.length > 0 ? (
            <ProductGrid products={results} stores={storeMap} columns={3} />
          ) : (
            <div className="grid place-items-center rounded-3xl border border-dashed border-line px-6 py-20 text-center">
              <SearchX className="size-10 text-muted" aria-hidden />
              <h2 className="mt-4 text-xl font-semibold">Nothing matches those filters</h2>
              <p className="mt-2 max-w-sm text-sm text-muted">Try removing a filter or searching for something else.</p>
              <ButtonLink href="/products" className="mt-6">
                Clear all filters
              </ButtonLink>
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
