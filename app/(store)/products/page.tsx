import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import type { ActiveFilters } from "@/components/product/product-filters";
import { ProductsView } from "@/components/product/products-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { first } from "@/libs/url";
import { catalogQueries } from "@/services/queries";

function parseFilters(raw: Record<string, string | string[] | undefined>): ActiveFilters {
  return {
    q: first(raw.q)?.trim() || undefined,
    category: first(raw.category),
    store: first(raw.store),
    tag: first(raw.tag),
    campaign: first(raw.campaign),
    free: first(raw.free),
    sort: first(raw.sort),
  };
}

const TAG_TITLE: Record<string, string> = { new: "New arrivals", popular: "Popular products", flash: "Flash deals" };

export async function generateMetadata({ searchParams }: PageProps<"/products">): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  if (filters.q) return { title: `Results for “${filters.q}”` };
  if (filters.tag && TAG_TITLE[filters.tag]) return { title: TAG_TITLE[filters.tag] };
  if (filters.campaign) {
    const campaigns = await getServerQueryClient().fetchQuery(catalogQueries.campaigns()).catch(() => []);
    const title = campaigns.find((c) => c.slug === filters.campaign)?.title;
    if (title) return { title };
  }
  if (filters.category) {
    const categories = await getServerQueryClient().fetchQuery(catalogQueries.categories()).catch(() => []);
    const name = categories.find((c) => c.slug === filters.category)?.name;
    if (name) return { title: name };
  }
  return { title: "All products" };
}

/** Prefetch exactly what `ProductsView` will read for these filters, so results are server-rendered. */
export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const filters = parseFilters(await searchParams);
  const client = getServerQueryClient();

  await prefetchAll(
    client,
    catalogQueries.categories(),
    catalogQueries.stores(),
    filters.q
      ? catalogQueries.search(filters.q)
      : filters.campaign
        ? catalogQueries.campaignProducts(filters.campaign)
        : catalogQueries.products(),
    ...(filters.campaign ? [catalogQueries.campaigns()] : []),
  );

  return (
    <HydrationBoundary state={dehydrated(client)}>
      <ProductsView filters={filters} />
    </HydrationBoundary>
  );
}
