import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { ServicesView } from "@/components/services/services-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { serviceQueries } from "@/services/queries";

export const metadata: Metadata = {
  title: "Services",
  description: "Hire trusted local professionals on ODOS — repairs, cleaning, photography, tutoring and more.",
};

/**
 * Warmed on the server like the rest of the catalogue, so categories and listings are in the
 * markup rather than appearing after hydration. `prefetchQuery` records a failure in query state
 * instead of rejecting, which matters here: the services API is not deployed everywhere yet and
 * must not take this page down.
 */
export default async function ServicesPage() {
  const queryClient = getServerQueryClient();
  await prefetchAll(queryClient, serviceQueries.categories(), serviceQueries.list());

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <ServicesView />
    </HydrationBoundary>
  );
}
