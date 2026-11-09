"use client";

import Link from "next/link";
import type { Market, Store } from "@/types/catalog";
import { Media } from "@/components/ui/media";
import { SectionHeading } from "@/components/ui/section-heading";
import { favoriteShareActions, SpeedDial } from "@/components/ui/speed-dial";

/** How many market cards the home page shows; the rest are a tap away on /market. */
const MAX_MARKETS = 8;

/**
 * Physical markets from GET /catalog/markets, each linking to the Market page filtered to it.
 * The store count comes from the store list (`market_slug`), so it's only shown when known.
 */
export function MarketNearYou({ markets, stores }: { markets: Market[]; stores: Store[] }) {
  if (markets.length === 0) return null;

  const storeCount = new Map<string, number>();
  for (const store of stores) {
    if (store.marketSlug) storeCount.set(store.marketSlug, (storeCount.get(store.marketSlug) ?? 0) + 1);
  }

  return (
    <div>
      <SectionHeading title="Market near you" href="/market" hrefLabel="All markets" />
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {markets.slice(0, MAX_MARKETS).map((market, index) => (
          <li key={market.id} className="w-[70%] shrink-0 snap-start min-[480px]:w-[45%] sm:w-auto sm:shrink">
            <MarketCard market={market} stores={storeCount.get(market.slug) ?? 0} priority={index < 4} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarketCard({ market, stores, priority }: { market: Market; stores: number; priority: boolean }) {
  const href = `/market/${encodeURIComponent(market.slug)}`;
  // Markets can't be saved (no endpoint), so only the share action is offered.
  const actions = favoriteShareActions({ name: market.name, href, saved: false, onToggleFavorite: () => {} }).filter(
    (action) => action.key === "share",
  );

  return (
    <Link href={href} className="group block touch-manipulation select-none">
      <div className="relative">
        <Media
          src={market.imageUrl}
          name={market.name}
          priority={priority}
          className="aspect-3/4 rounded-3xl"
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 60vw"
          imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <SpeedDial actions={actions} className="absolute right-3 bottom-3" />
      </div>
      <p className="mt-3 truncate text-sm font-semibold">{market.name}</p>
      {stores > 0 && (
        <p className="text-xs text-muted">
          {stores} {stores === 1 ? "store" : "stores"}
        </p>
      )}
    </Link>
  );
}
