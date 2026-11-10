"use client";

import Image from "next/image";
import { SearchX } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { useCampaign, useStoreMap } from "@/hooks/use-catalog";

export function CampaignView({ slug }: { slug: string }) {
  const campaign = useCampaign(slug);
  const { map: stores } = useStoreMap();

  if (campaign.isError) {
    return (
      <Container className="py-12">
        <QueryError error={campaign.error} onRetry={() => campaign.refetch()} title="We couldn’t load this campaign" />
      </Container>
    );
  }

  if (!campaign.data) {
    return (
      <Container className="py-8 sm:py-12">
        <div className="h-48 animate-pulse rounded-3xl bg-surface-muted" aria-busy="true" />
        <ProductGridSkeleton className="mt-8 lg:grid-cols-4" count={8} />
      </Container>
    );
  }

  const { title, subtitle, description, bannerImageUrl, products } = campaign.data;

  return (
    <Container className="py-8 sm:py-12">
      <header className="overflow-hidden rounded-3xl bg-accent-soft">
        {bannerImageUrl && (
          <div className="relative aspect-[3/1] w-full">
            <Image src={bannerImageUrl} alt="" fill className="object-cover" sizes="100vw" priority />
          </div>
        )}
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
          {(subtitle || description) && <p className="mt-2 max-w-2xl text-muted">{subtitle ?? description}</p>}
          <p className="mt-3 text-sm text-muted">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
      </header>

      <div className="mt-10">
        {products.length > 0 ? (
          <ProductGrid products={products} stores={stores} columns={4} scrollOnMobile={false} />
        ) : (
          <EmptyState
            icon={<SearchX className="size-10 text-muted" aria-hidden />}
            title="Nothing in this campaign yet"
            description="Check back soon — vendors are still adding to it."
          />
        )}
      </div>
    </Container>
  );
}
