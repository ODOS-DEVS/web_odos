import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { ServiceDetailView } from "@/components/services/service-detail-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { serviceQueries, catalogQueries } from "@/services/queries";

export async function generateMetadata({ params }: PageProps<"/services/[id]">): Promise<Metadata> {
  const { id } = await params;
  // Shares the per-request client with the page body, so the title costs no extra request.
  try {
    const service = await getServerQueryClient().fetchQuery(serviceQueries.detail(id));
    return {
      title: service.title,
      description: service.summary ?? `Book ${service.title} on ODOS. Payment is held until the work is confirmed.`,
    };
  } catch {
    // Not deployed, unpublished, or gone — the page itself says so.
    return { title: "Service" };
  }
}

export default async function ServicePage({ params }: PageProps<"/services/[id]">) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  await prefetchAll(queryClient, serviceQueries.detail(id), catalogQueries.stores());

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <ServiceDetailView id={id} />
    </HydrationBoundary>
  );
}
