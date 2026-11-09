import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { ProductView } from "@/components/product/product-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { ApiError } from "@/services/http";
import { catalogQueries, reviewQueries } from "@/services/queries";
import type { Product } from "@/types/catalog";
import CONFIG from "@/utils/config";

/**
 * GET /catalog/products/{id} through the per-request query client, so `generateMetadata` and the page
 * share one request. A 404 becomes Next's not-found page; any other failure returns `undefined` and the
 * client view shows its own retryable error.
 */
async function loadProduct(id: string): Promise<Product | undefined> {
  try {
    return await getServerQueryClient().fetchQuery(catalogQueries.product(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return undefined;
  }
}

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160) || undefined,
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = await loadProduct(id);

  const client = getServerQueryClient();
  // Everything else the view reads; the vendor map comes from the store list.
  await prefetchAll(client, reviewQueries.forProduct(id), catalogQueries.similar(id), catalogQueries.stores());

  const jsonLd = product && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    ...(product.reviewCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    }),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: CONFIG.CURRENCY,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
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
      <ProductView id={id} />
    </HydrationBoundary>
  );
}
