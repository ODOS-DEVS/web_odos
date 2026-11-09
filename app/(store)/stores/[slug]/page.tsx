import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { StoreView } from "@/components/store/store-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries, voucherQueries } from "@/services/queries";
import type { Store } from "@/types/catalog";

/**
 * Stores are fetched by id, but URLs use the slug: resolve it from the store list (shared with the
 * client cache). Falls back to matching the id, for vendors linked by id. `null` = not on ODOS.
 */
async function findStore(slug: string): Promise<Store | null | undefined> {
  try {
    const stores = await getServerQueryClient().fetchQuery(catalogQueries.stores());
    return stores.find((s) => s.slug === slug) ?? stores.find((s) => s.id === slug) ?? null;
  } catch {
    // API unreachable: let the client view retry and show its own error rather than a false 404.
    return undefined;
  }
}

export async function generateMetadata({ params }: PageProps<"/stores/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await findStore(slug);
  if (!store) return {};
  return {
    title: store.name,
    description: store.description || `${store.name} on ODOS`,
    openGraph: { images: store.bannerUrl ? [store.bannerUrl] : store.logoUrl ? [store.logoUrl] : [] },
  };
}

export default async function StorePage({ params }: PageProps<"/stores/[slug]">) {
  const { slug } = await params;
  const store = await findStore(slug);
  if (store === null) notFound();

  const client = getServerQueryClient();
  if (store) {
    // Everything `StoreView` reads, so the page is complete on first paint.
    await prefetchAll(
      client,
      catalogQueries.store(store.id),
      catalogQueries.products({ store_id: store.id }),
      catalogQueries.storeSections(store.id),
      voucherQueries.forStore(store.id),
    );
  }

  const jsonLd = store && {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    description: store.description,
    image: store.bannerUrl ?? store.logoUrl ?? undefined,
    address: store.address ?? undefined,
    telephone: store.phone ?? undefined,
  };

  return (
    <HydrationBoundary state={dehydrated(client)}>
      {jsonLd && (
        <script
          type="application/ld+json"
          // Server-generated from API data; `<` is escaped so it can't close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <StoreView slug={slug} />
    </HydrationBoundary>
  );
}
