"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight, SearchX, Store as StoreIcon } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { useCategories, useMarkets, useProducts, useStores } from "@/hooks/use-catalog";
import { filterProducts } from "@/libs/catalog";
import { cn } from "@/libs/cn";
import { buildHref } from "@/libs/url";
import { MarketFilters, type MarketActiveFilters } from "./market-filters";

/** Placeholder matching the page: filter column, store strip, product grid. */
function MarketSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12" aria-busy="true" aria-label="Loading market">
      <div className="space-y-6">
        {[0, 1, 2].map((group) => (
          <div key={group} className="space-y-2.5">
            <div className="h-4 w-20 animate-pulse rounded bg-surface-muted" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-surface-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-8 flex gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="size-15 shrink-0 animate-pulse rounded-full bg-surface-muted" />
          ))}
        </div>
        <ProductGridSkeleton className="lg:grid-cols-3" scrollOnMobile={false} />
      </div>
    </div>
  );
}

/**
 * Stores grouped by physical market (GET /catalog/markets + /catalog/stores), then the picked store's
 * products (GET /catalog/products?store_id=…). Category, market, delivery and sale filters live in the URL.
 */
export function MarketView({ filters }: { filters: MarketActiveFilters }) {
  const stores = useStores();
  const categories = useCategories();
  const markets = useMarkets();

  const storeList = useMemo(() => stores.data ?? [], [stores.data]);
  const storeMap = useMemo(() => new Map(storeList.map((s) => [s.id, s])), [storeList]);
  const activeCategory = categories.data?.find((c) => c.slug === filters.category);
  const activeMarket = markets.data?.find((m) => m.slug === filters.market);

  // Stores the strip + "Store" filter offer, narrowed by category/market (but not by which store is picked).
  const visibleStores = storeList.filter((store) => {
    if (activeCategory && store.category.toLowerCase() !== activeCategory.name.toLowerCase()) return false;
    if (filters.market && store.marketSlug !== filters.market) return false;
    return true;
  });

  const selectedStore = (filters.store ? visibleStores.find((s) => s.slug === filters.store) : undefined) ?? visibleStores[0];

  // Only the picked store's products are fetched.
  const products = useProducts({ store_id: selectedStore?.id });
  const results = selectedStore
    ? filterProducts(
        (products.data ?? []).filter((p) => p.storeId === selectedStore.id),
        storeList,
        {
          category: filters.category,
          tag: filters.sale ? "flash" : undefined,
          freeDelivery: Boolean(filters.free),
        },
      )
    : [];

  const storeHref = (slug: string) => buildHref("/market", filters, { store: slug });
  const loading = stores.isPending || categories.isPending || markets.isPending;

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">Local Markets</h1>
        <p className="mt-2 text-muted">
          Discover stores and authentic products straight from Ghana&apos;s iconic physical trading hubs.
        </p>
      </header>

      {/* When a specific market filter is active */}
      {activeMarket && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-4 min-w-0">
            {activeMarket.imageUrl && (
              <Media
                src={activeMarket.imageUrl}
                name={activeMarket.name}
                className="size-16 shrink-0 rounded-2xl border border-line object-cover"
                sizes="64px"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone="accent">Physical Market</Badge>
                <span className="text-xs text-muted">
                  {visibleStores.length} {visibleStores.length === 1 ? "store" : "stores"}
                </span>
              </div>
              <h2 className="mt-1 truncate text-xl font-bold sm:text-2xl text-foreground">
                {activeMarket.name}
              </h2>
              <p className="truncate text-xs text-muted">
                Stores and products trading out of {activeMarket.name}.
              </p>
            </div>
          </div>
          <ButtonLink
            href={`/market/${activeMarket.slug}`}
            variant="outline"
            className="shrink-0 self-start sm:self-auto"
          >
            Open Market Hub <ChevronRight className="size-4 ml-1" />
          </ButtonLink>
        </div>
      )}

      {/* When browsing all markets, display the interactive markets grid */}
      {!activeMarket && markets.data && markets.data.length > 0 && (
        <div className="mb-10">
          <div className="mb-3.5 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">Explore Markets</h2>
            <span className="text-xs text-muted">{markets.data.length} physical markets</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {markets.data.map((m) => {
              const count = storeList.filter(
                (s) => (s.marketSlug && s.marketSlug.toLowerCase() === m.slug.toLowerCase()) || s.id === m.id
              ).length;
              return (
                <Link
                  key={m.id}
                  href={`/market/${m.slug}`}
                  className="group flex flex-col items-center rounded-2xl border border-line bg-surface p-3 text-center transition-all hover:border-accent hover:shadow-sm"
                >
                  <Media
                    src={m.imageUrl}
                    name={m.name}
                    className="size-16 rounded-xl object-cover mb-2"
                    sizes="64px"
                  />
                  <p className="w-full truncate text-xs font-semibold text-foreground group-hover:text-accent">
                    {m.name}
                  </p>
                  <span className="mt-0.5 text-[11px] text-muted">
                    {count} {count === 1 ? "store" : "stores"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <MarketSkeleton />
      ) : stores.isError ? (
        <QueryError error={stores.error} onRetry={() => stores.refetch()} title="We couldn’t load stores" />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
          <div className="lg:sticky lg:top-40 lg:self-start">
            <MarketFilters active={filters} categories={categories.data ?? []} stores={visibleStores} markets={markets.data ?? []} />
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
                        <Media src={store.logoUrl ?? store.bannerUrl} name={store.name} className="size-full" sizes="56px" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {selectedStore ? (
              <>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-semibold">{selectedStore.name}</h2>
                    <p className="mt-1 text-muted">
                      {products.isPending ? "Loading…" : `${results.length} ${results.length === 1 ? "product" : "products"}`}
                    </p>
                  </div>
                  <ButtonLink href={`/stores/${selectedStore.slug}`} variant="outline" className="shrink-0">
                    <StoreIcon className="size-4" aria-hidden />
                    Visit Store
                  </ButtonLink>
                </div>

                {products.isPending ? (
                  <ProductGridSkeleton className="lg:grid-cols-3" scrollOnMobile={false} />
                ) : products.isError ? (
                  <QueryError error={products.error} onRetry={() => products.refetch()} title="We couldn’t load this store’s products" />
                ) : results.length > 0 ? (
                  <ProductGrid products={results} stores={storeMap} columns={3} scrollOnMobile={false} />
                ) : (
                  <EmptyState
                    icon={<SearchX className="size-10 text-muted" aria-hidden />}
                    title="Nothing matches those filters"
                    description="Try another category or clear delivery filters."
                  />
                )}
              </>
            ) : (
              <EmptyState
                icon={<SearchX className="size-10 text-muted" aria-hidden />}
                title={activeMarket ? `No stores at ${activeMarket.name} yet` : "No stores match yet"}
                description="Try a different category or market."
                action={
                  filters.market || filters.category ? <ButtonLink href="/market">Show all stores</ButtonLink> : undefined
                }
              />
            )}
          </section>
        </div>
      )}
    </Container>
  );
}
