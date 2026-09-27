"use client";

import Link from "next/link";
import { Check, ChevronRight, Star } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGrid } from "@/components/product/product-grid";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ReviewsList } from "@/components/product/reviews-list";
import { DeliveryNote } from "@/components/store/delivery-note";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { Price } from "@/components/ui/price";
import { QueryError } from "@/components/ui/query-error";
import { Rating } from "@/components/ui/rating";
import { SectionHeading } from "@/components/ui/section-heading";
import { relatedProducts } from "@/libs/catalog";
import { discountPercent } from "@/libs/format";
import { mockProduct, mockProductReviews, mockProducts, mockStoreMap } from "@/mocks/catalog.mock";
import { fakeQuery } from "@/mocks/query";
import { ApiError } from "@/services/http";
import type { Product } from "@/types/catalog";

export function ProductView({ id }: { id: string }) {
  const found = mockProduct(id);
  const product = found
    ? fakeQuery(found)
    : fakeQuery(undefined as Product | undefined, { isError: true, error: new ApiError(404, "Product not found") });
  const reviews = fakeQuery(mockProductReviews(id));
  const all = fakeQuery(mockProducts());
  const stores = mockStoreMap();

  if (product.isError) return <Container className="py-12"><QueryError error={product.error} onRetry={() => product.refetch()} title="We couldn’t load this product" /></Container>;
  if (!product.data) return <Container className="py-12"><div className="h-[32rem] animate-pulse rounded-3xl bg-surface-muted" aria-busy="true" /></Container>;

  const p = product.data;
  const store = p.storeId ? stores.get(p.storeId) : undefined;
  const off = discountPercent(p.price, p.compareAtPrice);
  const related = relatedProducts(all.data ?? [], p);
  const categorySlug = p.categorySlugs[0];

  return (
    <Container className="py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {p.categoryName && (
          <>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={categorySlug ? `/products?category=${categorySlug}` : "/products"} className="hover:text-foreground">
              {p.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" aria-hidden />
        <span aria-current="page" className="text-foreground">{p.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <ProductGallery product={p} />

        <div className="lg:sticky lg:top-40 lg:self-start">
          {store && (
            <Link
              href={`/stores/${store.slug}`}
              className="press inline-flex max-w-full items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pr-4 pl-1.5 text-sm hover:border-foreground"
            >
              <Media src={store.logoUrl} name={store.name} sizes="32px" className="size-8 shrink-0 rounded-full" />
              <span className="truncate font-medium">{store.name}</span>
              {store.rating > 0 && <Rating value={store.rating} />}
            </Link>
          )}

          <h1 className="mt-5 text-3xl leading-tight font-semibold sm:text-4xl">{p.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {p.reviewCount > 0 && <Rating value={p.rating} count={p.reviewCount} />}
            {off > 0 && <Badge tone="accent">Save {off}%</Badge>}
            {p.tags.includes("new") && <Badge tone="success">New</Badge>}
            {p.tags.includes("flash") && <Badge tone="warning">Flash sale</Badge>}
          </div>

          <Price value={p.price} compareAt={p.compareAtPrice ?? undefined} size="lg" className="mt-5" />

          {p.description && <p className="mt-5 leading-7 whitespace-pre-line text-muted">{p.description}</p>}

          {p.specifications.length > 0 && (
            <ul className="mt-5 space-y-2 text-sm">
              {p.specifications.map((spec) => (
                <li key={spec} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {spec}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <PurchasePanel product={p} />
          </div>

          {store && (
            <div className="mt-8">
              <DeliveryNote store={store} />
            </div>
          )}
        </div>
      </div>

      <section className="mt-20" aria-labelledby="reviews-heading">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="reviews-heading" className="text-2xl font-semibold sm:text-3xl">Reviews</h2>
          {p.reviewCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Star className="size-4 fill-current text-warning" aria-hidden />
              <span className="font-medium text-foreground tabular-nums">{p.rating.toFixed(1)}</span>
              from {p.reviewCount.toLocaleString("en-GH")} {p.reviewCount === 1 ? "review" : "reviews"}
            </div>
          )}
        </div>
        {reviews.isPending ? (
          <div className="h-32 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
        ) : reviews.data && reviews.data.length > 0 ? (
          <ReviewsList reviews={reviews.data} />
        ) : (
          <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-muted">No reviews yet.</p>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related-heading">
          <SectionHeading
            title="You might also like"
            href={store ? `/stores/${store.slug}` : undefined}
            hrefLabel={store ? `More from ${store.name}` : undefined}
          />
          <h2 id="related-heading" className="sr-only">Related products</h2>
          <ProductGrid products={related} stores={stores} />
        </section>
      )}
    </Container>
  );
}
