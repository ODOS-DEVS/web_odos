import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { StoreView } from "@/components/store/store-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries, voucherQueries } from "@/services/queries";
import type { Store } from "@/types/catalog";

/**
 * The backend fetches a store by id, never by slug, so the slug is resolved against the (cached)
 * store list — the same trick `useStoreBySlug` uses on the client. One request per server render,
 * shared with `generateMetadata` through the per-request query client.
 */
async function loadStore(slug: string): Promise<Store | undefined> {
  const queryClient = getServerQueryClient();
  const stores = await queryClient.fetchQuery(catalogQueries.stores());
  return stores.find((s) => s.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/stores/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await loadStore(slug);
  if (!store) return {};
  return {
    title: store.name,
    description: store.description || `${store.name} on ODOS`,
    openGraph: { images: store.bannerUrl ? [store.bannerUrl] : store.logoUrl ? [store.logoUrl] : [] },
  };
}

export default async function StorePage({ params }: PageProps<"/stores/[slug]">) {
  const { slug } = await params;
  const store = await loadStore(slug);
  if (!store) notFound();

  const queryClient = getServerQueryClient();
  await prefetchAll(
    queryClient,
    catalogQueries.products({ store_id: store.id }),
    catalogQueries.storeSections(store.id),
    voucherQueries.forStore(store.id),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    description: store.description,
    image: store.bannerUrl ?? store.logoUrl ?? undefined,
    address: store.address ?? undefined,
    telephone: store.phone ?? undefined,
  };

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <script
        type="application/ld+json"
        // Static, server-generated data — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <StoreView slug={slug} />
    </HydrationBoundary>
  );
}
