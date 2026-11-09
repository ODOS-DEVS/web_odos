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
 * The query client is cached per request, so `generateMetadata` and the page body share one fetch.
 * A 404 from the API is the product genuinely not existing; anything else is a real failure and is
 * re-thrown so the error boundary — not `notFound()` — handles it.
 */
async function loadProduct(id: string): Promise<Product | null> {
  const queryClient = getServerQueryClient();
  try {
    return await queryClient.fetchQuery(catalogQueries.product(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
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
  if (!product) notFound();

  // The reviews and the "related products" rail are part of the first paint, so warm them too.
  const queryClient = getServerQueryClient();
  await prefetchAll(queryClient, catalogQueries.products(), catalogQueries.stores(), reviewQueries.forProduct(id));

  const jsonLd = {
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
    <HydrationBoundary state={dehydrated(queryClient)}>
      <script
        type="application/ld+json"
        // Static, server-generated data — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductView id={id} />
    </HydrationBoundary>
  );
}
