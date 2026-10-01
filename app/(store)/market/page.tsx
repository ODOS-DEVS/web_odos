import type { Metadata } from "next";
import type { MarketActiveFilters } from "@/components/market/market-filters";
import { MarketView } from "@/components/market/market-view";
import { first } from "@/libs/url";

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

// `MarketView` reads `mocks/` directly, so there is nothing to prefetch server-side for now.
export default async function MarketPage({ searchParams }: PageProps<"/market">) {
  const filters = parseFilters(await searchParams);
  return <MarketView filters={filters} />;
}
