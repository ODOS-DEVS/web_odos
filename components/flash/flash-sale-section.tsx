"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { Badge } from "@/components/ui/badge";
import { useFlashSaleProducts } from "@/hooks/use-catalog";
import { queryKeys } from "@/services/queries";
import type { FlashSaleEvent, Store } from "@/types/catalog";
import { Countdown } from "./countdown";

/**
 * One running flash sale on the home page: title, live countdown and its first products
 * (GET /catalog/flash-sale-events/{slug}/products), linking to the full sale page.
 */
export function FlashSaleSection({ event, stores, limit = 4 }: { event: FlashSaleEvent; stores: Map<string, Store>; limit?: number }) {
  const queryClient = useQueryClient();
  const products = useFlashSaleProducts(event.slug);
  const items = products.data ?? [];
  const href = `/flash-sales/${encodeURIComponent(event.slug)}`;

  if (products.isSuccess && items.length === 0) return null;

  return (
    <section aria-labelledby={`flash-${event.id}`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:mb-6">
        <div className="min-w-0">
          <Badge tone="accent" className="mb-2">
            <Zap className="size-3" aria-hidden /> Flash sale
          </Badge>
          <h2 id={`flash-${event.id}`} className="text-lg leading-tight font-semibold min-[360px]:text-[1.35rem] sm:text-3xl">
            {event.title}
          </h2>
          {event.subtitle && <p className="mt-1 text-sm text-muted">{event.subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {/* When it hits zero, drop the event so the section disappears. */}
          <Countdown endsAt={event.endsAt} onEnd={() => queryClient.invalidateQueries({ queryKey: queryKeys.flashSaleEvents })} />
          <Link href={href} className="shrink-0 text-sm font-medium text-accent hover:underline">
            See all{event.productCount > limit ? ` ${event.productCount}` : ""}
          </Link>
        </div>
      </div>
      {products.isPending ? <ProductGridSkeleton count={limit} /> : <ProductGrid products={items.slice(0, limit)} stores={stores} />}
    </section>
  );
}
