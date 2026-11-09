import { HydrationBoundary } from "@tanstack/react-query";
import { HomeSections } from "@/components/home/home-sections";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";

/**
 * The catalogue is public, so every section the shopper sees first is fetched on the server and
 * handed to the client cache already warm — `HomeSections` then reads it without a second request.
 */
export default async function HomePage() {
  const queryClient = getServerQueryClient();
  await prefetchAll(
    queryClient,
    catalogQueries.categories(),
    catalogQueries.stores(),
    catalogQueries.products(),
    catalogQueries.deals(),
  );

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <HomeSections />
    </HydrationBoundary>
  );
}
