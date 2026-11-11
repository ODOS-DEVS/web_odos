"use client";

import Link from "next/link";
import { ArrowRight, Flame, Megaphone, Tag, Zap } from "lucide-react";
import { Countdown } from "@/components/deals/countdown";
import { ProductCard } from "@/components/product/product-card";
import { VoucherCard } from "@/components/store/voucher-card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { useDealsHub } from "@/hooks/use-catalog";
import type { DealsHub, DealsHubSection } from "@/types/catalog";

/**
 * The hub decides which sections exist — the backend only emits a section
 * when it has content, so nothing here invents headings for empty shelves.
 */
function sectionFor(hub: DealsHub, kind: string): DealsHubSection | null {
  return hub.sections.find((s) => s.kind === kind) ?? null;
}

function SectionHeading({ section, icon }: { section: DealsHubSection; icon: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent">{icon}</span>
      <div>
        <h2 className="text-lg font-semibold tracking-normal">{section.title}</h2>
        {section.subtitle && <p className="text-sm text-muted">{section.subtitle}</p>}
      </div>
    </div>
  );
}

function FlashRail({ hub }: { hub: DealsHub }) {
  const section = sectionFor(hub, "flash_sales");
  if (!section || hub.flashEvents.length === 0) return null;
  return (
    <section>
      <SectionHeading section={section} icon={<Zap className="size-4" aria-hidden />} />
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
        {hub.flashEvents.map((event) => (
          <Link
            key={event.id}
            href={`/products?flash_event=${encodeURIComponent(event.slug)}`}
            className="press group relative w-72 shrink-0 overflow-hidden rounded-2xl border border-line bg-surface"
          >
            <Media src={event.imageUrl} name={event.title} className="h-36 w-full" />
            <div className="p-4">
              <p className="truncate font-semibold">{event.title}</p>
              {event.subtitle && <p className="mt-0.5 truncate text-sm text-muted">{event.subtitle}</p>}
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted">
                  {event.productCount} {event.productCount === 1 ? "deal" : "deals"}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-accent">
                  <Flame className="size-4" aria-hidden />
                  <Countdown endsAt={event.endsAt} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PromoCodes({ hub }: { hub: DealsHub }) {
  const section = sectionFor(hub, "vouchers");
  if (!section || hub.promotions.length === 0) return null;
  return (
    <section>
      <SectionHeading section={section} icon={<Tag className="size-4" aria-hidden />} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hub.promotions.map((voucher) => (
          <VoucherCard key={voucher.id} voucher={voucher} />
        ))}
      </div>
    </section>
  );
}

function DealProducts({ hub }: { hub: DealsHub }) {
  const section = sectionFor(hub, "products");
  if (!section || hub.dealProducts.length === 0) return null;
  return (
    <section>
      <SectionHeading section={section} icon={<Flame className="size-4" aria-hidden />} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {hub.dealProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function CampaignStrip({ hub }: { hub: DealsHub }) {
  const section = sectionFor(hub, "campaigns");
  if (!section || hub.campaigns.length === 0) return null;
  return (
    <section>
      <SectionHeading section={section} icon={<Megaphone className="size-4" aria-hidden />} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hub.campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/campaigns/${campaign.slug}`}
            className="press group flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-4"
          >
            <Media src={campaign.bannerImageUrl} name={campaign.title} className="size-20 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{campaign.title}</p>
              {campaign.subtitle && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{campaign.subtitle}</p>}
              <p className="mt-1 text-xs text-muted">
                {campaign.productCount} {campaign.productCount === 1 ? "product" : "products"}
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function DealsView() {
  const hub = useDealsHub();

  if (hub.isPending) {
    return (
      <Container className="py-10">
        <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
      </Container>
    );
  }
  if (hub.isError) {
    return (
      <Container className="py-10">
        <QueryError error={hub.error} onRetry={() => hub.refetch()} />
      </Container>
    );
  }

  const data = hub.data;
  const empty =
    !data ||
    (data.flashEvents.length === 0 &&
      data.promotions.length === 0 &&
      data.dealProducts.length === 0 &&
      data.campaigns.length === 0);

  return (
    <Container className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">Deals</h1>
        <p className="mt-2 max-w-xl text-muted">
          Flash sales, promo codes and price cuts from stores across Ghana — every price here is set by the store or an
          ODOS sale, never invented for the banner.
        </p>
      </header>

      {empty ? (
        <EmptyState
          icon={<Tag className="size-10 text-muted" aria-hidden />}
          title="No deals running right now"
          description="Stores add discounts and promo codes all the time — check back soon."
        />
      ) : (
        <div className="space-y-12">
          <FlashRail hub={data} />
          <PromoCodes hub={data} />
          <DealProducts hub={data} />
          <CampaignStrip hub={data} />
        </div>
      )}
    </Container>
  );
}
