import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { StoreView } from "@/components/store/store-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries, serviceQueries, voucherQueries } from "@/services/queries";
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
  // A shared store link has to render a real card in WhatsApp and on Facebook, which needs the
  // title, description, canonical URL and an image — an images-only openGraph block left the
  // first two to be guessed from the page, and gave the crawler no canonical to attribute to.
  const title = store.name;
  const description = store.description || `${store.name} on ODOS`;
  const image = store.bannerUrl ?? store.logoUrl;

  return {
    title,
    description,
    alternates: { canonical: `/stores/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/stores/${slug}`,
      siteName: "ODOS",
      images: image ? [image] : [],
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
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
    // A business can offer both. Prefetched so the Products/Services tabs are in the markup
    // rather than appearing after hydration; prefetchQuery records a failure in query state
    // instead of rejecting, so a store on an environment without services still renders.
    serviceQueries.list({ store_id: store.id }),
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
