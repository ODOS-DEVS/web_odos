import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreView } from "@/components/store/store-view";
import { mockStoreBySlug } from "@/mocks/catalog.mock";

export async function generateMetadata({ params }: PageProps<"/stores/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = mockStoreBySlug(slug);
  if (!store) return {};
  return {
    title: store.name,
    description: store.description || `${store.name} on ODOS`,
    openGraph: { images: store.bannerUrl ? [store.bannerUrl] : store.logoUrl ? [store.logoUrl] : [] },
  };
}

// `StoreView` reads `mocks/` directly, so there is nothing to prefetch server-side for now.
export default async function StorePage({ params }: PageProps<"/stores/[slug]">) {
  const { slug } = await params;
  const store = mockStoreBySlug(slug);
  if (!store) notFound();

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
    <>
      <script
        type="application/ld+json"
        // Static, server-generated data — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <StoreView slug={slug} />
    </>
  );
}
