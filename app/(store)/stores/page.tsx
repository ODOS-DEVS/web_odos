import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { StoresView } from "@/components/store/stores-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";

export const metadata: Metadata = {
  title: "Stores",
  description: "Independent vendors near you, each with their own riders and delivery rates.",
};

/** Prefetch the store list (GET /catalog/stores) so the directory is server-rendered. */
export default async function StoresPage() {
  const client = getServerQueryClient();
  await prefetchAll(client, catalogQueries.stores());
  return (
    <HydrationBoundary state={dehydrated(client)}>
      <StoresView />
    </HydrationBoundary>
  );
}
