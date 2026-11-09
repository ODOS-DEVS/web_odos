import { HydrationBoundary } from "@tanstack/react-query";
import { HomeSections } from "@/components/home/home-sections";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries, voucherQueries } from "@/services/queries";

/**
 * Prefetch every public query the home page reads, then hand the cache to the client. `HomeSections`
 * uses the same `catalogQueries` factories, so the first render is complete and crawlable. A failed
 * prefetch is not fatal: that section's hook retries in the browser and shows its own error state.
 */
export default async function HomePage() {
  const client = getServerQueryClient();
  await prefetchAll(
    client,
    catalogQueries.categories(),
    catalogQueries.stores(),
    catalogQueries.products(),
    catalogQueries.deals(),
    catalogQueries.markets(),
    catalogQueries.promoBanners(),
    catalogQueries.campaigns(),
    catalogQueries.flashSaleEvents(),
    // Guest copy; a signed-in shopper's own copy (with `claimed`) loads in the browser.
    voucherQueries.promotions(),
  );
  // Then the products of the (up to two) sales the home page shows.
  const events = client.getQueryData(catalogQueries.flashSaleEvents().queryKey) ?? [];
  await prefetchAll(client, ...events.slice(0, 2).map((event) => catalogQueries.flashSaleProducts(event.slug)));

  return (
    <HydrationBoundary state={dehydrated(client)}>
      <HomeSections />
    </HydrationBoundary>
  );
}
