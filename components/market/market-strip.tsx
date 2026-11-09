"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Store as StoreIcon } from "lucide-react";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";
import type { Market, Store } from "@/types/catalog";

/**
 * The markets themselves, as the first thing on the page — they were only reachable as small chips
 * in the filter sidebar before, which made them easy to miss entirely.
 *
 * Each tile shows how many vendors trade there, counted from the store list. A market shows
 * "No vendors yet" when no store has been assigned to it, which is honest: until a vendor sets its
 * market (on the store profile, or in its application) there is genuinely nothing to show inside.
 */
export function MarketStrip({
  markets,
  stores,
  activeSlug,
  hrefFor,
  isPending,
}: {
  markets: Market[];
  stores: Store[];
  activeSlug?: string;
  hrefFor: (slug: string | undefined) => string;
  isPending?: boolean;
}) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, markets]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (isPending) {
    return (
      <ul className="no-scrollbar -mx-4 mb-8 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-busy="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="w-44 shrink-0 sm:w-52 lg:w-56">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-muted" />
            <div className="mt-2 h-4 w-20 animate-pulse rounded bg-surface-muted" />
          </li>
        ))}
      </ul>
    );
  }

  if (markets.length === 0) return null;

  const vendorCount = new Map<string, number>();
  for (const store of stores) {
    if (store.marketSlug) vendorCount.set(store.marketSlug, (vendorCount.get(store.marketSlug) ?? 0) + 1);
  }

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          {activeSlug && (
            <Link href={hrefFor(undefined)} scroll={false} className="press text-sm font-medium text-accent hover:opacity-80">
              Show all markets
            </Link>
          )}
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="press grid size-8 place-items-center rounded-full border border-line bg-background text-foreground transition-opacity hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="press grid size-8 place-items-center rounded-full border border-line bg-background text-foreground transition-opacity hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <ul
        ref={scrollRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:px-0"
      >
        {markets.map((market) => {
          const count = vendorCount.get(market.slug) ?? 0;
          const active = market.slug === activeSlug;
          return (
            <li key={market.id} className="w-44 shrink-0 snap-start sm:w-52 lg:w-56">
              <Link
                href={hrefFor(active ? undefined : market.slug)}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className="press group block"
              >
                <div
                  className={cn(
                    "relative aspect-[4/3] overflow-hidden rounded-2xl ring-2 transition-all duration-200",
                    active ? "ring-accent" : "ring-transparent group-hover:ring-line",
                  )}
                >
                  <Media
                    src={market.imageUrl}
                    name={market.name}
                    className="size-full"
                    imgClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                    sizes="(min-width: 1024px) 224px, (min-width: 640px) 208px, 176px"
                  />
                </div>
                <p className={cn("mt-2 truncate text-sm font-medium", active && "text-accent")}>{market.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <StoreIcon className="size-3" aria-hidden />
                  {count > 0 ? `${count} ${count === 1 ? "vendor" : "vendors"}` : "No vendors yet"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
