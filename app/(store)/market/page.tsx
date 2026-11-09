import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import type { MarketActiveFilters } from "@/components/market/market-filters";
import { MarketView } from "@/components/market/market-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { first } from "@/libs/url";
import { catalogQueries } from "@/services/queries";

function parseFilters(raw: Record<string, string | string[] | undefined>): MarketActiveFilters {
  return {
    category: first(raw.category),
    store: first(raw.store),
    market: first(raw.market),
    free: first(raw.free),
    sale: first(raw.sale),
  };
}

export const metadata: Metadata = { title: "Market" };

export default async function MarketPage({ searchParams }: PageProps<"/market">) {
  const filters = parseFilters(await searchParams);

  const queryClient = getServerQueryClient();
  await prefetchAll(
    queryClient,
    catalogQueries.stores(),
    catalogQueries.categories(),
    catalogQueries.products(),
    catalogQueries.markets(),
  );

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <MarketView filters={filters} />
    </HydrationBoundary>
  );
}
