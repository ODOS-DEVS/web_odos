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
    free: first(raw.free),
    sort: first(raw.sort),
  };
}

const TAG_TITLE: Record<string, string> = { new: "New arrivals", popular: "Popular products", flash: "Flash deals" };

export async function generateMetadata({ searchParams }: PageProps<"/products">): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  if (filters.q) return { title: `Results for “${filters.q}”` };
  if (filters.tag && TAG_TITLE[filters.tag]) return { title: TAG_TITLE[filters.tag] };
  if (filters.category) {
    // Shares the per-request query client with the page body, so this costs no extra request.
    const categories = await getServerQueryClient().fetchQuery(catalogQueries.categories());
    const name = categories.find((c) => c.slug === filters.category)?.name;
    if (name) return { title: name };
  }
  return { title: "All products" };
}

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const filters = parseFilters(await searchParams);

  const queryClient = getServerQueryClient();
  await prefetchAll(
    queryClient,
    catalogQueries.products(),
    catalogQueries.stores(),
    catalogQueries.categories(),
    // A search lands in the first paint too, rather than flashing a skeleton after hydration.
    ...(filters.q ? [catalogQueries.search(filters.q)] : []),
  );

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <ProductsView filters={filters} />
    </HydrationBoundary>
  );
}
