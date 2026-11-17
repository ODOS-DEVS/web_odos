"use client";

import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { useHomeFeed } from "@/hooks/use-feed";

/** Only these get a "see all" link — the rest are a curated row, not a browsable filter. */
const SECTION_HREF: Record<string, string> = {
  trending: "/products?tag=popular",
  recently_viewed: "/products",
  wishlist: "/wishlist",
};

/**
 * The personalised rows: recommendations, trending, recently viewed, saved and the week's
 * spotlight category — all computed server-side by `/home-feed/`.
 *
 * Sections the API omits for this shopper simply do not render, so a signed-out visitor sees
 * best-sellers and a returning one sees their own history, without the page guessing which.
 */
export function FeedSections() {
  const { data, isPending, isError } = useHomeFeed();

  if (isPending) {
    return (
      <Container className="py-6">
        <div className="h-7 w-48 animate-pulse rounded-full bg-surface-muted" aria-busy="true" />
        <div className="mt-5">
          <ProductGridSkeleton count={4} />
        </div>
      </Container>
    );
  }

  // A feed failure must not take the homepage down — the catalogue sections around it still work.
  if (isError || !data?.sections.length) return null;

  return (
    <>
      {data.sections.map((section) => (
        <Container key={section.key} className="py-6">
          <SectionHeading
            title={section.title}
            description={section.subtitle ?? undefined}
            href={SECTION_HREF[section.key]}
          />
          <div className="mt-5">
            <ProductGrid products={section.products.slice(0, 8)} />
          </div>
        </Container>
      ))}
    </>
  );
}
