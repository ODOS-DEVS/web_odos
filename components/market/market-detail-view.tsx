"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin, SearchX, Store as StoreIcon } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { StoreCard, StoreCardSkeleton } from "@/components/store/store-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useCategories, useMarketBySlug, useProducts, useStores } from "@/hooks/use-catalog";
import type { Store } from "@/types/catalog";

export function MarketDetailSkeleton() {
  return (
    <Container className="py-8 sm:py-12" aria-busy="true" aria-label="Loading market details">
      <div className="h-5 w-48 animate-pulse rounded-md bg-surface-muted" />
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="size-24 shrink-0 animate-pulse rounded-3xl bg-surface-muted sm:size-32" />
        <div className="space-y-3 flex-1">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-surface-muted" />
          <div className="h-4 w-40 animate-pulse rounded-md bg-surface-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-surface-muted" />
        </div>
      </div>
      <div className="mt-10 h-10 w-60 animate-pulse rounded-full bg-surface-muted" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <StoreCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}

export function MarketDetailView({ slug }: { slug: string }) {
  const marketQuery = useMarketBySlug(slug);
  const storesQuery = useStores();
  const categoriesQuery = useCategories();

  const [activeTab, setActiveTab] = useState<"stores" | "products">("stores");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const market = marketQuery.data;

  // Filter stores that belong to this physical market
  const marketStores = useMemo(() => {
    if (!market || !storesQuery.data) return [];
    return storesQuery.data.filter(
      (s) =>
        (s.marketSlug && s.marketSlug.toLowerCase() === market.slug.toLowerCase()) ||
        s.marketSlug === market.id ||
        (market.id && s.id === market.id)
    );
  }, [market, storesQuery.data]);

  const storeMap = useMemo(
    () => new Map<string, Store>((storesQuery.data ?? []).map((s) => [s.id, s])),
    [storesQuery.data]
  );

  // Collect market store IDs to query products
  const marketStoreIds = useMemo(() => marketStores.map((s) => s.id), [marketStores]);

  // Primary store product query (or all products from first store as initial peek)
  const productsQuery = useProducts({
    store_id: marketStoreIds.length === 1 ? marketStoreIds[0] : undefined,
  });

  // Filter products belonging to stores in this market
  const marketProducts = useMemo(() => {
    if (!productsQuery.data) return [];
    const idSet = new Set(marketStoreIds);
    let list = productsQuery.data.filter((p) => p.storeId && idSet.has(p.storeId));
    if (selectedCategory) {
      list = list.filter((p) =>
        p.categorySlugs.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
      );
    }
    return list;
  }, [productsQuery.data, marketStoreIds, selectedCategory]);

  // Derived location from stores trading in this market
  const location = useMemo(() => {
    const places = new Set<string>();
    for (const s of marketStores) {
      const loc = [s.city, s.region].filter(Boolean).join(", ");
      if (loc) places.add(loc);
    }
    return Array.from(places).join(" · ") || "Ghana";
  }, [marketStores]);

  if (marketQuery.isPending || storesQuery.isPending) {
    return <MarketDetailSkeleton />;
  }

  if (marketQuery.isError) {
    return (
      <Container className="py-12">
        <QueryError
          error={marketQuery.error}
          onRetry={() => marketQuery.refetch()}
          title="We couldn't load this market"
        />
      </Container>
    );
  }

  if (!market) {
    return (
      <Container className="py-12">
        <EmptyState
          icon={<StoreIcon className="size-10 text-muted" aria-hidden />}
          title="Market not found"
          description="We couldn't find the market you were looking for. Browse all markets below."
          action={<ButtonLink href="/market">View all markets</ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/market" className="hover:text-foreground">Markets</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span aria-current="page" className="text-foreground font-medium">{market.name}</span>
      </nav>

      {/* Market Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:p-10 mb-8 sm:mb-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {market.imageUrl && (
            <Media
              src={market.imageUrl}
              name={market.name}
              className="size-24 shrink-0 rounded-2xl sm:size-32 shadow-sm border border-line"
              sizes="(min-width: 640px) 128px, 96px"
              priority
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge tone="accent">Physical Market</Badge>
              <span className="flex items-center gap-1 text-xs text-muted">
                <MapPin className="size-3.5 text-accent" aria-hidden />
                {location}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold sm:text-4xl tracking-tight text-foreground">
              {market.name}
            </h1>

            <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
              Explore independent vendors and authentic goods trading directly from {market.name}.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted">
              <span>
                <strong className="text-foreground font-semibold">{marketStores.length}</strong>{" "}
                {marketStores.length === 1 ? "store" : "stores"} trading here
              </span>
              <span className="h-3 w-px bg-line" aria-hidden />
              <span>Direct delivery to your doorstep</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Stores vs Products */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex gap-2">
          <TogglePill selected={activeTab === "stores"} onClick={() => setActiveTab("stores")}>
            Stores ({marketStores.length})
          </TogglePill>
          <TogglePill selected={activeTab === "products"} onClick={() => setActiveTab("products")}>
            Products
          </TogglePill>
        </div>

        {activeTab === "products" && categoriesQuery.data && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-foreground text-background"
                  : "bg-surface-muted text-muted hover:text-foreground"
              }`}
            >
              All Categories
            </button>
            {categoriesQuery.data.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === c.slug ? null : c.slug)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === c.slug
                    ? "bg-foreground text-background"
                    : "bg-surface-muted text-muted hover:text-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content based on Active Tab */}
      {activeTab === "stores" ? (
        marketStores.length > 0 ? (
          <ul className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {marketStores.map((store, index) => (
              <li key={store.id}>
                <StoreCard store={store} priority={index < 3} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<StoreIcon className="size-10 text-muted" aria-hidden />}
            title={`No stores registered at ${market.name} yet`}
            description="Are you a vendor trading at this market? Join ODOS to reach customers across Ghana."
            action={
              <ButtonLink href="/account?tab=become-a-vendor" variant="accent">
                Become a vendor
              </ButtonLink>
            }
          />
        )
      ) : productsQuery.isPending ? (
        <ProductGridSkeleton className="lg:grid-cols-3" scrollOnMobile={false} />
      ) : marketProducts.length > 0 ? (
        <ProductGrid products={marketProducts} stores={storeMap} columns={3} scrollOnMobile={false} />
      ) : (
        <EmptyState
          icon={<SearchX className="size-10 text-muted" aria-hidden />}
          title="No products found"
          description={
            selectedCategory
              ? "Try picking another category or viewing all stores."
              : `Products from vendors at ${market.name} will appear here.`
          }
        />
      )}
    </Container>
  );
}

