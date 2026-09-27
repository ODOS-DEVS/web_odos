import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/product/product-view";
import CONFIG from "@/utils/config";
import { mockProduct } from "@/mocks/catalog.mock";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = mockProduct(id);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160) || undefined,
    openGraph: { images: product.images.slice(0, 1) },
  };
}

// `ProductView` reads `mocks/` directly, so there is nothing to prefetch server-side for now.
export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = mockProduct(id);
  if (!product) notFound();

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
    <>
      <script
        type="application/ld+json"
        // Static, server-generated data — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductView id={id} />
    </>
  );
}
