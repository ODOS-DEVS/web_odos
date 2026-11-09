import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { FlashSalesView } from "@/components/flash/flash-sales-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";

export const metadata: Metadata = {
  title: "Flash sales",
  description: "Limited-time prices from ODOS vendors, while the timer and stock last.",
};

export default async function FlashSalesPage() {
  const client = getServerQueryClient();
  await prefetchAll(client, catalogQueries.flashSaleEvents());
  return (
    <HydrationBoundary state={dehydrated(client)}>
      <FlashSalesView />
    </HydrationBoundary>
  );
}
