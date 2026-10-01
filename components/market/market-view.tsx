"use client";

import Link from "next/link";
import { SearchX, Store as StoreIcon } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { filterProducts } from "@/libs/catalog";
import { cn } from "@/libs/cn";
import { buildHref } from "@/libs/url";
import { MOCK_CATEGORIES, MOCK_MARKETS, MOCK_STORES, mockProducts } from "@/mocks/catalog.mock";
import { fakeQuery } from "@/mocks/query";
import { MarketFilters, type MarketActiveFilters } from "./market-filters";

export function MarketView({ filters }: { filters: MarketActiveFilters }) {
  const stores = fakeQuery(MOCK_STORES);
  const categories = fakeQuery(MOCK_CATEGORIES);
  const products = fakeQuery(mockProducts());

  const storeList = stores.data ?? [];
  const storeMap = new Map(storeList.map((s) => [s.id, s]));
  const activeCategory = categories.data?.find((c) => c.slug === filters.category);

  // Stores the strip + "Store" filter offer, narrowed by category/market (but not by which store is picked).
  const visibleStores = storeList.filter((store) => {
    if (activeCategory && store.category !== activeCategory.name) return false;
    if (filters.market && store.marketSlug !== filters.market) return false;
    return true;
  });

  const selectedStore = (filters.store ? visibleStores.find((s) => s.slug === filters.store) : undefined) ?? visibleStores[0];

  const results = selectedStore
    ? filterProducts(products.data ?? [], storeList, {
        category: filters.category,
        store: selectedStore.slug,
        tag: filters.sale ? "flash" : undefined,
        freeDelivery: Boolean(filters.free),
      })
    : [];

  const storeHref = (slug: string) => buildHref("/market", filters, { store: slug });

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">Market</h1>
        <p className="mt-2 text-muted">This is a collection of store at a location</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
        <div className="lg:sticky lg:top-40 lg:self-start">
          <MarketFilters active={filters} categories={categories.data ?? []} stores={storeList} markets={MOCK_MARKETS} />
        </div>

        <section aria-label="Results">
          {visibleStores.length > 0 && (
            <ul className="no-scrollbar mb-8 flex gap-3 overflow-x-auto">
              {visibleStores.map((store) => (
                <li key={store.id}>
                  <Link
                    href={storeHref(store.slug)}
                    scroll={false}
                    aria-current={selectedStore?.id === store.id ? "true" : undefined}
                    aria-label={store.name}
                    title={store.name}
                    className={cn(
                      "press block shrink-0 rounded-full p-0.75 transition-colors duration-200",
                      selectedStore?.id === store.id ? "bg-accent" : "bg-transparent hover:bg-line",
                    )}
                  >
                    <span className="block size-14 overflow-hidden rounded-full ring-2 ring-background">
                      <Media src={store.bannerUrl} name={store.name} className="size-full" sizes="56px" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {products.isPending || stores.isPending ? (
            <ProductGridSkeleton className="lg:grid-cols-3" />
          ) : selectedStore ? (
            <>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedStore.name}</h2>
                  <p className="mt-1 text-muted">
                    {results.length} {results.length === 1 ? "product" : "products"}
                  </p>
                </div>
                <ButtonLink href={`/stores/${selectedStore.slug}`} variant="outline" className="shrink-0">
                  <StoreIcon className="size-4" aria-hidden />
                  Visit Store
                </ButtonLink>
              </div>

              {results.length > 0 ? (
                <ProductGrid products={results} stores={storeMap} columns={3} />
              ) : (
                <div className="grid place-items-center rounded-3xl border border-dashed border-line px-6 py-20 text-center">
                  <SearchX className="size-10 text-muted" aria-hidden />
                  <h3 className="mt-4 text-xl font-semibold">Nothing matches those filters</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted">Try another category or clear delivery filters.</p>
                </div>
              )}
            </>
          ) : (
            <div className="grid place-items-center rounded-3xl border border-dashed border-line px-6 py-20 text-center">
              <SearchX className="size-10 text-muted" aria-hidden />
              <h3 className="mt-4 text-xl font-semibold">No stores in this market yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted">Try a different category or market.</p>
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
