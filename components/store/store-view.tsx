"use client";

import { Zap } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { DeliveryNote } from "@/components/store/delivery-note";
import { StoreContact } from "@/components/store/store-contact";
import { StoreHeader, StoreInfoBar } from "@/components/store/store-header";
import { StoreOffers } from "@/components/store/store-offers";
import { VoucherCard } from "@/components/store/voucher-card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { QueryError } from "@/components/ui/query-error";
import { SectionHeading } from "@/components/ui/section-heading";
import { mockProducts, mockStoreBySlug, mockStoreSections } from "@/mocks/catalog.mock";
import { fakeQuery } from "@/mocks/query";
import { mockStoreVouchers } from "@/mocks/vouchers.mock";
import { ApiError } from "@/services/http";
import type { Product, Store } from "@/types/catalog";

export function StoreView({ slug }: { slug: string }) {
  const found = mockStoreBySlug(slug);
  const { data: store, isPending, isError, error, refetch } = found
    ? fakeQuery(found)
    : fakeQuery(undefined as Store | undefined, { isError: true, error: new ApiError(404, "Store not found") });
  const products = fakeQuery(mockProducts({ store_id: store?.id }));
  const sections = fakeQuery(mockStoreSections(store?.id ?? ""));

  if (isError) return <Container className="py-12"><QueryError error={error} onRetry={() => refetch()} title="We couldn’t load this store" /></Container>;
  if (isPending || !store) return <Container className="py-12"><div className="h-96 animate-pulse rounded-3xl bg-surface-muted" aria-busy="true" /></Container>;

  const list = products.data ?? [];
  const storeMap = new Map([[store.id, store]]);
  const flash = list.filter((p) => p.tags.includes("flash"));
  const hasEndDate = flash.some((p) => p.flashSale?.endsAt);
  const vouchers = fakeQuery(mockStoreVouchers(store.id)).data ?? [];

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
              <SectionHeading title="Voucher" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {vouchers.map((voucher) => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
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
