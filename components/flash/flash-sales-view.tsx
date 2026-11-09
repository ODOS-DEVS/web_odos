"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Zap } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { useFlashSaleEvents, useFlashSaleProducts, useStoreMap } from "@/hooks/use-catalog";
import { queryKeys } from "@/services/queries";
import { Countdown } from "./countdown";

/** /flash-sales — every running sale (GET /catalog/flash-sale-events/active). */
export function FlashSalesView() {
  const queryClient = useQueryClient();
  const events = useFlashSaleEvents();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.flashSaleEvents });

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-semibold sm:text-4xl">
          <Zap className="size-7 text-accent" aria-hidden /> Flash sales
        </h1>
        <p className="mt-2 text-muted">Limited-time prices — each sale ends when its timer runs out or stock sells.</p>
      </header>

      {events.isPending ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2" aria-busy="true">
          {[0, 1].map((i) => (
            <li key={i} className="h-64 animate-pulse rounded-3xl bg-surface-muted" />
          ))}
        </ul>
      ) : events.isError ? (
        <QueryError error={events.error} onRetry={() => events.refetch()} title="We couldn’t load flash sales" />
      ) : events.data.length === 0 ? (
        <EmptyState
          icon={<Zap className="size-10 text-muted" aria-hidden />}
          title="No flash sales right now"
          description="Check back soon, or browse everyday deals."
          action={<ButtonLink href="/products?tag=flash">See deals</ButtonLink>}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {events.data.map((event, index) => (
            <li key={event.id}>
              <Link
                href={`/flash-sales/${encodeURIComponent(event.slug)}`}
                className="group block overflow-hidden rounded-3xl border border-line bg-surface hover:border-foreground/30"
              >
                <Media
                  src={event.imageUrl}
                  name={event.title}
                  priority={index < 2}
                  className="aspect-[2/1] w-full"
                  sizes="(min-width: 640px) 50vw, 100vw"
                  imgClassName="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                />
                <div className="space-y-2 p-5">
                  <h2 className="text-xl font-semibold">{event.title}</h2>
                  {event.subtitle && <p className="text-sm text-muted">{event.subtitle}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <Countdown endsAt={event.endsAt} onEnd={refresh} />
                    <span className="text-sm text-muted">
                      {event.productCount} {event.productCount === 1 ? "product" : "products"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

/** /flash-sales/{slug} — one sale's products (GET /catalog/flash-sale-events/{slug}/products). */
export function FlashSaleView({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const events = useFlashSaleEvents();
  const products = useFlashSaleProducts(slug);
  const { map: stores } = useStoreMap();
  const event = events.data?.find((e) => e.slug === slug);
  const ended = events.isSuccess && !event;

  return (
    <Container className="py-8 sm:py-12">
      <Link href="/flash-sales" className="press -ml-2 mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All flash sales
      </Link>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold sm:text-4xl">{event?.title ?? (ended ? "This sale has ended" : "Flash sale")}</h1>
          {event?.subtitle && <p className="mt-2 text-muted">{event.subtitle}</p>}
        </div>
        {event && (
          <Countdown
            endsAt={event.endsAt}
            className="text-base"
            onEnd={() => queryClient.invalidateQueries({ queryKey: queryKeys.flashSaleEvents })}
          />
        )}
      </header>

      {products.isPending ? (
        <ProductGridSkeleton className="lg:grid-cols-4" scrollOnMobile={false} />
      ) : products.isError ? (
        <QueryError error={products.error} onRetry={() => products.refetch()} title="We couldn’t load this sale" />
      ) : products.data.length === 0 || ended ? (
        <EmptyState
          icon={<Zap className="size-10 text-muted" aria-hidden />}
          title={ended ? "This flash sale has ended" : "Nothing in this sale yet"}
          description="See what other sales are running right now."
          action={<ButtonLink href="/flash-sales">All flash sales</ButtonLink>}
        />
      ) : (
        <ProductGrid products={products.data} stores={stores} scrollOnMobile={false} />
      )}
    </Container>
  );
}
