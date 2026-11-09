"use client";

import Link from "next/link";
import { Media } from "@/components/ui/media";
import { SectionHeading } from "@/components/ui/section-heading";
import { useMarkets } from "@/hooks/use-catalog";
import type { Market } from "@/types/catalog";

/**
 * The physical markets vendors trade in — Kaneshie, Makola and the rest.
 *
 * This used to render the *store* list under a "Market near you" heading, falling back to the
 * store's own name whenever it had no market, so it showed shops rather than markets. It reads
 * `/catalog/markets` directly now.
 */
export function MarketNearYou() {
  const markets = useMarkets();
  const list = markets.data ?? [];

  if (list.length === 0) return null;

  return (
    <div>
      <SectionHeading title="Markets near you" href="/market" hrefLabel="All markets" />
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0">
        {list.slice(0, 4).map((market) => (
          <li key={market.id} className="w-[84%] shrink-0 snap-start sm:w-auto sm:shrink">
            <MarketCard market={market} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarketCard({ market }: { market: Market }) {
  return (
    <Link href={`/market?market=${market.slug}`} className="group block touch-manipulation select-none">
      <Media
        src={market.imageUrl}
        name={market.name}
        className="aspect-3/4 rounded-3xl"
        sizes="(min-width: 640px) 22vw, 60vw"
        imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      <p className="mt-3 truncate text-sm font-semibold">{market.name}</p>
    </Link>
  );
}
