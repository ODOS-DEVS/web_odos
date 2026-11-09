import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { MarketDetailView } from "@/components/market/market-detail-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";
import type { Market } from "@/types/catalog";

async function findMarket(slug: string): Promise<Market | null | undefined> {
  try {
    const markets = await getServerQueryClient().fetchQuery(catalogQueries.markets());
    return markets.find((m) => m.slug === slug || m.id === slug) ?? null;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params }: PageProps<"/market/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const market = await findMarket(slug);
  if (!market) return { title: "Market" };
  return {
    title: `${market.name} | Markets`,
    description: `Browse vendors and products trading at ${market.name} on ODOS.`,
    openGraph: {
      images: market.imageUrl ? [market.imageUrl] : [],
    },
  };
}

export default async function MarketDetailPage({ params }: PageProps<"/market/[slug]">) {
  const { slug } = await params;
  const market = await findMarket(slug);
  if (market === null) notFound();

  const client = getServerQueryClient();
  await prefetchAll(client, catalogQueries.markets(), catalogQueries.stores(), catalogQueries.categories());

  return (
    <HydrationBoundary state={dehydrated(client)}>
      <MarketDetailView slug={slug} />
    </HydrationBoundary>
  );
}

