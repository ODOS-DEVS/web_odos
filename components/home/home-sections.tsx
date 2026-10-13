"use client";

import { Zap } from "lucide-react";
import { CategoryStrip } from "@/components/home/category-strip";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { MarketNearYou } from "@/components/home/market-near-you";
import { PromoBanners } from "@/components/home/promo-banners";
import { PromoCollage } from "@/components/home/promo-collage";
import { WeeklyDealBanner } from "@/components/home/weekly-deal-banner";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { StoreCard, StoreCardSkeleton } from "@/components/store/store-card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { QueryError } from "@/components/ui/query-error";
import { SectionHeading } from "@/components/ui/section-heading";
import { newestFirst } from "@/libs/catalog";
import { MOCK_CATEGORIES, MOCK_STORES, mockDealProducts, mockProducts } from "@/mocks/catalog.mock";
import { fakeQuery } from "@/mocks/query";

/** Home page content. Every section reads from the query cache the server prefetched, and hides itself when empty. */
export function HomeSections() {
  const categories = fakeQuery(MOCK_CATEGORIES);
  const stores = fakeQuery(MOCK_STORES);
  const products = fakeQuery(mockProducts());
  const deals = fakeQuery(mockDealProducts());

  const storeMap = new Map((stores.data ?? []).map((s) => [s.id, s]));
  const all = products.data ?? [];
  const flash = deals.data?.length ? deals.data : all.filter((p) => p.tags.includes("flash"));
  const hasEndDate = flash.some((p) => p.flashSale?.endsAt);
  const popular = all.filter((p) => p.tags.includes("popular"));
  const newest = newestFirst(all).slice(0, 4);

  return (
    <>
      <Hero />

      {categories.data && categories.data.length > 0 && (
        <Container className="mt-14">
          <SectionHeading title="Shop by category" />
          <CategoryStrip categories={categories.data} />
        </Container>
      )}

      {flash.length > 0 && (
        <Container className="mt-20">
          <SectionHeading
            title="Flash deals"
            description="Limited-time prices from vendors near you."
            href="/products?tag=flash"
            eyebrow={
              // Only claim urgency when a deal actually has an end date.
              hasEndDate ? (
                <Badge tone="accent">
                  <Zap className="size-3" aria-hidden /> Limited time
                </Badge>
              ) : undefined
            }
          />
          <ProductGrid products={flash.slice(0, 4)} stores={storeMap} />
        </Container>
      )}

      <Container className="mt-20">
        <PromoBanners />
      </Container>

      {flash.length > 0 && (
        <Container className="mt-20">
          <SectionHeading title="Best deals" href="/products?tag=flash" />
          <ProductGrid products={flash.slice(0, 4)} stores={storeMap} />
        </Container>
      )}

      <Container className="mt-20">
        <SectionHeading
          title="Stores near you"
          description="Independent vendors, each with their own riders and delivery rates."
          href="/stores"
          hrefLabel="All stores"
        />
        {stores.isPending ? (
          <ul
            className="no-scrollbar -mx-4 flex gap-4 overflow-hidden px-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-9 sm:px-0 lg:grid-cols-3"
            aria-busy="true"
          >
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="w-[84%] shrink-0 sm:w-auto sm:shrink">
                <StoreCardSkeleton />
              </li>
            ))}
          </ul>
        ) : stores.isError ? (
          <QueryError error={stores.error} onRetry={() => stores.refetch()} title="We couldn’t load stores" />
        ) : (
          <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-9 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {stores.data.slice(0, 6).map((store, index) => (
              <li key={store.id} className="w-[84%] shrink-0 snap-start sm:w-auto sm:shrink">
                <StoreCard store={store} priority={index < 3} />
              </li>
            ))}
          </ul>
        )}
      </Container>

      <Container className="mt-20">
        <PromoCollage />
      </Container>

      {popular.length > 0 && (
        <Container className="mt-20">
          <SectionHeading title="Popular right now" href="/products?tag=popular" />
          <ProductGrid products={popular.slice(0, 4)} stores={storeMap} />
        </Container>
      )}

      <Container className="mt-20">
        <SectionHeading title="New arrivals" href="/products" hrefLabel="All products" />
        {products.isPending ? (
          <ProductGridSkeleton count={4} />
        ) : products.isError ? (
          <QueryError error={products.error} onRetry={() => products.refetch()} title="We couldn’t load products" />
        ) : (
          <ProductGrid products={newest} stores={storeMap} />
        )}
      </Container>

      <div className="mt-20">
        <WeeklyDealBanner />
      </div>

      <Container className="mt-20">
        <MarketNearYou stores={stores.data ?? []} />
      </Container>

      <HowItWorks />

      <Faq />
    </>
  );
}
