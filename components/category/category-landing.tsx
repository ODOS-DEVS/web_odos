"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, PackageSearch } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { SectionHeading } from "@/components/ui/section-heading";
import { filterProducts, newestFirst } from "@/libs/catalog";
import { useCategories, useProducts, useStoreMap } from "@/hooks/use-catalog";

/**
 * A category's own page: its types, its newest arrivals and what is in it.
 *
 * Distinct from `/products?category=slug`, which is the full filterable grid. This is the
 * browsable entry point that earns its own URL and metadata, and hands off to that grid for
 * anything more specific.
 */
export function CategoryLanding({ slug }: { slug: string }) {
  const categories = useCategories();
  const products = useProducts();
  const { map: storeMap } = useStoreMap();

  if (categories.isError) {
    return (
      <Container className="py-10">
        <QueryError title="We couldn't load this category" error={categories.error} onRetry={() => categories.refetch()} />
      </Container>
    );
  }

  if (categories.isPending) {
    return (
      <Container className="py-10">
        <div className="h-9 w-56 animate-pulse rounded-full bg-surface-muted" aria-busy="true" />
        <div className="mt-8">
          <ProductGridSkeleton count={8} />
        </div>
      </Container>
    );
  }

  const category = categories.data?.find((c) => c.slug === slug);
  if (!category) notFound();

  const all = products.data ?? [];
  const inCategory = filterProducts(all, [...storeMap.values()], { category: slug });
  const newest = newestFirst(inCategory).slice(0, 8);

  return (
    <Container className="py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/categories" className="press hover:text-foreground">
          Categories
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Media src={category.imageUrl} name={category.name} sizes="64px" className="size-16 shrink-0 rounded-2xl" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{category.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {category.subtitle || `${inCategory.length} product${inCategory.length === 1 ? "" : "s"} on ODOS`}
            </p>
          </div>
        </div>
        <ButtonLink href={`/products?category=${category.slug}`} variant="outline">
          Browse all
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </header>

      {category.subcategories.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold">Shop by type</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {category.subcategories.map((name) => (
              <li key={name}>
                <Link
                  href={`/products?category=${category.slug}&subcategory=${encodeURIComponent(name)}`}
                  className="press inline-flex rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-foreground"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {products.isPending ? (
        <div className="mt-10">
          <ProductGridSkeleton count={8} />
        </div>
      ) : inCategory.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<PackageSearch className="size-10 text-muted" aria-hidden />}
            title={`Nothing in ${category.name} yet`}
            description="No vendor has listed in this category so far. Try another category, or browse everything."
            action={<ButtonLink href="/products">Browse all products</ButtonLink>}
          />
        </div>
      ) : (
        <>
          <section className="mt-10">
            <SectionHeading title="New in" href={`/products?category=${category.slug}`} />
            <div className="mt-5">
              <ProductGrid products={newest} stores={storeMap} />
            </div>
          </section>

          <section className="mt-14">
            <SectionHeading
              title={`All ${category.name.toLowerCase()}`}
              description={`${inCategory.length} product${inCategory.length === 1 ? "" : "s"}`}
              href={`/products?category=${category.slug}`}
            />
            <div className="mt-5">
              <ProductGrid products={inCategory.slice(0, 12)} stores={storeMap} />
            </div>
          </section>
        </>
      )}
    </Container>
  );
}
