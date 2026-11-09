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

export async function generateMetadata({ searchParams }: PageProps<"/market">): Promise<Metadata> {
  const { market } = parseFilters(await searchParams);
  if (!market) return { title: "Market" };
  const markets = await getServerQueryClient().fetchQuery(catalogQueries.markets()).catch(() => []);
  return { title: markets.find((m) => m.slug === market)?.name ?? "Market" };
}

/** Prefetch the store, category and market lists; the picked store's products load in the browser. */
export default async function MarketPage({ searchParams }: PageProps<"/market">) {
  const filters = parseFilters(await searchParams);
  const client = getServerQueryClient();
  await prefetchAll(client, catalogQueries.stores(), catalogQueries.categories(), catalogQueries.markets());

  return (
    <HydrationBoundary state={dehydrated(client)}>
      <MarketView filters={filters} />
    </HydrationBoundary>
  );
}
