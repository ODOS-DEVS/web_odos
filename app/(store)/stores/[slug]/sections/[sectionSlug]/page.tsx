import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { StoreSectionView } from "@/components/store/store-section-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { ApiError } from "@/services/http";
import { catalogQueries } from "@/services/queries";
import type { Store, StoreSectionDetail } from "@/types/catalog";

/** The API addresses stores by id, so the slug is resolved against the cached store list. */
async function loadStore(slug: string): Promise<Store | undefined> {
  const stores = await getServerQueryClient().fetchQuery(catalogQueries.stores());
  return stores.find((s) => s.slug === slug);
}

async function loadSection(storeId: string, sectionSlug: string): Promise<StoreSectionDetail | null> {
  try {
    return await getServerQueryClient().fetchQuery(catalogQueries.storeSection(storeId, sectionSlug));
  } catch (error) {
    // Hidden and unknown shelves both 404 on the API; neither is a public page.
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/stores/[slug]/sections/[sectionSlug]">): Promise<Metadata> {
  const { slug, sectionSlug } = await params;
  const store = await loadStore(slug);
  if (!store) return {};
  const section = await loadSection(store.id, sectionSlug);
  if (!section) return {};

  const title = `${section.title} · ${store.name}`;
  const description = section.description || `${section.title} from ${store.name} on ODOS.`;
  const image = section.coverImageUrl ?? store.bannerUrl ?? store.logoUrl;

  return {
    title,
    description,
    alternates: { canonical: `/stores/${slug}/sections/${sectionSlug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/stores/${slug}/sections/${sectionSlug}`,
      siteName: "ODOS",
      images: image ? [image] : [],
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function StoreSectionPage({
  params,
}: PageProps<"/stores/[slug]/sections/[sectionSlug]">) {
  const { slug, sectionSlug } = await params;
  const store = await loadStore(slug);
  if (!store) notFound();

  const section = await loadSection(store.id, sectionSlug);
  if (!section) notFound();

  const queryClient = getServerQueryClient();
  // The nav needs the shop's other shelves.
  await prefetchAll(queryClient, catalogQueries.storeSections(store.id));

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <StoreSectionView slug={slug} sectionSlug={sectionSlug} />
    </HydrationBoundary>
  );
}
