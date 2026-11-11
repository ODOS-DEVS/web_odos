import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { DealsView } from "@/components/deals/deals-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";

export const metadata: Metadata = {
  title: "Deals",
  description: "Flash sales, promo codes and price cuts from stores across Ghana.",
};

export default async function DealsPage() {
  const queryClient = getServerQueryClient();
  await prefetchAll(queryClient, catalogQueries.dealsHub());
  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <DealsView />
    </HydrationBoundary>
  );
}
