import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { CampaignsIndexView } from "@/components/campaign/campaigns-index-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Shopping events running on ODOS right now.",
};

export default async function CampaignsPage() {
  const queryClient = getServerQueryClient();
  await prefetchAll(queryClient, catalogQueries.campaigns());
  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <CampaignsIndexView />
    </HydrationBoundary>
  );
}
