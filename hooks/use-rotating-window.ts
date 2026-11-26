"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Steps through a list a page at a time, on a timer.
 *
 * Built for showcase strips that would otherwise sit on the same few items
 * forever while the rest of the catalogue goes unseen. Everything it does is
 * about not being annoying:
 *
 * - It stops while the pointer is over the strip or focus is inside it, so a
 *   row cannot change out from under someone reading or about to click it.
 * - It stops when the tab is hidden, so a backgrounded page is not burning
 *   renders and the viewer does not return to a different page than they left.
 * - It does not run at all when the reader has asked for reduced motion, or
 *   when there is only one page to show.
 *
 * Returns whole pages rather than a sliding window: advancing by one would
 * reshuffle two thirds of the strip to reveal a single new item, which reads
 * as a glitch rather than a rotation.
 */
export function useRotatingWindow<T>(
  items: T[],
  pageSize: number,
  intervalMs = 7000,
): {
  page: T[];
  pageIndex: number;
  pageCount: number;
  goTo: (index: number) => void;
  /** Spread onto the container so hovering or focusing it pauses the timer. */
  pauseHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocusCapture: () => void;
    onBlurCapture: () => void;
  };
} {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const [pageIndex, setPageIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const sync = () => setDocumentHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // Derived rather than corrected in an effect: a refetch that shortens the
  // list must not strand the viewer on a page that no longer exists, and
  // clamping here means there is never a render where it has.
  const safeIndex = pageIndex >= pageCount ? 0 : pageIndex;

  useEffect(() => {
    if (paused || documentHidden || reducedMotion || pageCount < 2) return;
    const timer = window.setInterval(
      () => setPageIndex((current) => (current + 1) % pageCount),
      intervalMs,
    );
    return () => window.clearInterval(timer);
  }, [paused, documentHidden, reducedMotion, pageCount, intervalMs]);

  const page = useMemo(() => {
    const start = safeIndex * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safeIndex, pageSize]);

  const goTo = useCallback(
    (index: number) => setPageIndex(((index % pageCount) + pageCount) % pageCount),
    [pageCount],
  );

  return {
    page,
    pageIndex: safeIndex,
    pageCount,
    goTo,
    pauseHandlers: {
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      onFocusCapture: () => setPaused(true),
      onBlurCapture: () => setPaused(false),
    },
  };
}
