"use client";

import { Zap } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { DeliveryNote } from "@/components/store/delivery-note";
import { StoreContact } from "@/components/store/store-contact";
import { StoreHeader, StoreInfoBar } from "@/components/store/store-header";
import { StoreOffers } from "@/components/store/store-offers";
import { TrackEvent } from "@/components/tracking/track";
import { VoucherCard } from "@/components/store/voucher-card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { QueryError } from "@/components/ui/query-error";
import { SectionHeading } from "@/components/ui/section-heading";
import { useProducts, useStore, useStoreBySlug, useStoreSections } from "@/hooks/use-catalog";
import { useStoreVouchers } from "@/hooks/use-product-extras";
import type { Product } from "@/types/catalog";

/** Placeholder shaped like the store page: banner, info bar, product grid beside the details column. */
function StoreSkeleton() {
  return (
    <Container className="pt-4 pb-8 sm:pt-6" aria-busy="true" aria-label="Loading store">
      <div className="aspect-[3/1] min-h-44 animate-pulse rounded-3xl bg-surface-muted" />
      <div className="mt-6 h-16 animate-pulse rounded-2xl bg-surface-muted" />
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12">
        <ProductGridSkeleton count={6} className="lg:grid-cols-3" />
        <div className="space-y-5">
          <div className="h-44 animate-pulse rounded-2xl bg-surface-muted" />
          <div className="h-36 animate-pulse rounded-2xl bg-surface-muted" />
        </div>
      </div>
    </Container>
  );
}

/**
 * A store's page. The slug resolves to the store's id through the cached store list, then the detail
 * record, its products (`store_id`), its own sections and its vouchers load by id.
 */
export function StoreView({ slug }: { slug: string }) {
  const listed = useStoreBySlug(slug);
  const storeId = listed.data?.id;
  const detail = useStore(storeId);
  // The detail record can carry more than the list row; show the list row until it arrives.
  const store = detail.data ?? listed.data;
  const products = useProducts({ store_id: storeId });
  const sections = useStoreSections(storeId);
  const voucherQuery = useStoreVouchers(storeId);

  if (listed.isError) {
    return (
      <Container className="py-12">
        <QueryError error={listed.error} onRetry={() => listed.refetch()} title="We couldn’t load this store" />
      </Container>
    );
  }
  if (listed.isPending) return <StoreSkeleton />;
  if (!store) {
    return (
      <Container className="py-12">
        <QueryError error={new Error("This store doesn’t exist or is no longer on ODOS.")} title="Store not found" />
      </Container>
    );
  }

  // The products endpoint is filtered by `store_id`; guard anyway so another vendor's item never shows.
  const list = (products.data ?? []).filter((p) => !p.storeId || p.storeId === store.id);
  const storeMap = new Map([[store.id, store]]);
  const flash = list.filter((p) => p.tags.includes("flash"));
  const hasEndDate = flash.some((p) => p.flashSale?.endsAt);
  const vouchers = voucherQuery.data ?? [];

  // Vendors group their products into their own sections ("Shoes", "Bags"…); anything left over follows.
  const grouped: { id: string; title: string; items: Product[] }[] = [];
  const placed = new Set<string>();
  for (const section of sections.data ?? []) {
    const items = section.products.filter((p) => list.some((l) => l.id === p.id));
    items.forEach((p) => placed.add(p.id));
    if (items.length) grouped.push({ id: section.id, title: section.title, items });
  }
  const rest = list.filter((p) => !placed.has(p.id));
  if (grouped.length && rest.length) grouped.push({ id: "other", title: "More products", items: rest });
  const blocks = grouped.length ? grouped : [{ id: "all", title: "Products", items: list }];

  return (
    <Container className="pt-4 pb-8 sm:pt-6">
      <StoreHeader store={store} />

      <TrackEvent event_type="store_view" store_id={store.id} source_screen="store" />
      <div className="mt-6">
        <StoreInfoBar store={store} />
      </div>

      <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12">
        <div className="min-w-0 space-y-14">
          <StoreOffers store={store} products={list} />

          {flash.length > 0 && (
            <section>
              <SectionHeading
                title="Flash Sales"
                href="#products"
                hrefLabel="Browse all products"
                eyebrow={
                  hasEndDate ? (
                    <Badge tone="accent">
                      <Zap className="size-3" aria-hidden /> Limited time
                    </Badge>
                  ) : undefined
                }
              />
              <ProductGrid products={flash} stores={storeMap} columns={3} className="xl:grid-cols-3" />
            </section>
          )}

          <section id="products" aria-labelledby="products-heading" className="scroll-mt-40">
            <h2 id="products-heading" className="sr-only">
              Products
            </h2>
            {products.isPending ? (
              <ProductGridSkeleton count={4} className="lg:grid-cols-3 xl:grid-cols-4" />
            ) : products.isError ? (
              <QueryError error={products.error} onRetry={() => products.refetch()} title="We couldn’t load this store’s products" />
            ) : list.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-6 py-14 text-center text-muted">This store hasn’t listed any products yet.</p>
            ) : (
              <div className="space-y-12">
                {blocks.map((block) => (
                  <div key={block.id}>
                    <SectionHeading title={block.title} />
                    <ProductGrid products={block.items} stores={storeMap} columns={3} className="xl:grid-cols-3" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {vouchers.length > 0 && (
            <section aria-labelledby="vouchers-heading">
              <SectionHeading title="Vouchers" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {vouchers.map((voucher) => (
                  <VoucherCard key={voucher.id} voucher={voucher} storeId={store.id} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside aria-label="Store details" className="space-y-5 lg:tall:sticky lg:tall:top-40">
          <DeliveryNote store={store} />
          <StoreContact store={store} />
        </aside>
      </div>
    </Container>
  );
}
