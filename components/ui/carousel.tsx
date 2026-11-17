"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/libs/cn";

/**
 * A horizontally scrolling row with optional arrow controls.
 *
 * Built on native scroll-snap rather than a JS slider: touch, trackpad and keyboard all work for
 * free, it costs no dependency, and it degrades to a plain scrollable row if JS never runs. The
 * arrows are progressive enhancement — they appear only when there is something to scroll to, and
 * are hidden from assistive tech because the list itself is already keyboard-reachable.
 *
 * Deliberately no autoplay. A row that moves on its own steals attention from the page and makes
 * a link the reader was about to click move out from under them.
 */
export function Carousel({
  children,
  label,
  className,
  itemClassName,
  controls = true,
}: {
  children: ReactNode;
  /** Names the region for screen readers, e.g. "Featured campaigns". */
  label: string;
  className?: string;
  /** Applied to each child wrapper — set the item width here. */
  itemClassName?: string;
  controls?: boolean;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // 2px of slack: sub-pixel layout means scrollLeft rarely hits the exact bound.
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });

    // Also re-check when the row or its contents resize — a late-loading image changes scrollWidth
    // and would otherwise leave the arrows in a stale state.
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);

    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [sync, children]);

  const nudge = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    // Scroll by roughly one viewport of the row, so a page feels like a page at any width.
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const items = Array.isArray(children) ? children : [children];
  const showControls = controls && !(atStart && atEnd);

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={trackRef}
        aria-label={label}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-1 sm:gap-4"
      >
        {items.map((child, index) => (
          <li key={index} className={cn("shrink-0 snap-start", itemClassName)}>
            {child}
          </li>
        ))}
      </ul>

      {showControls && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => nudge(-1)}
            disabled={atStart}
            className={cn(
              "press absolute top-1/2 left-0 hidden size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface shadow-md transition-opacity lg:grid",
              atStart ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => nudge(1)}
            disabled={atEnd}
            className={cn(
              "press absolute top-1/2 right-0 hidden size-10 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface shadow-md transition-opacity lg:grid",
              atEnd ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}
