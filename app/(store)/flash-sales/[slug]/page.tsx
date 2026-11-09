import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { FlashSaleView } from "@/components/flash/flash-sales-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";

export async function generateMetadata({ params }: PageProps<"/flash-sales/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const events = await getServerQueryClient().fetchQuery(catalogQueries.flashSaleEvents()).catch(() => []);
  const event = events.find((e) => e.slug === slug);
  return event
    ? { title: event.title, description: event.subtitle ?? `${event.title} on ODOS`, openGraph: { images: event.imageUrl ? [event.imageUrl] : [] } }
    : { title: "Flash sale" };
}

/** An ended or unknown sale still renders (with a pointer to running sales) rather than a 404. */
export default async function FlashSalePage({ params }: PageProps<"/flash-sales/[slug]">) {
  const { slug } = await params;
  const client = getServerQueryClient();
  await prefetchAll(client, catalogQueries.flashSaleEvents(), catalogQueries.flashSaleProducts(slug), catalogQueries.stores());
  return (
    <HydrationBoundary state={dehydrated(client)}>
      <FlashSaleView slug={slug} />
    </HydrationBoundary>
  );
}
