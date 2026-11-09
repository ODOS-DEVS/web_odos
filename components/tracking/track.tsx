"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackBehavior, trackPromo, type BehaviorEvent } from "@/services/tracking.service";

/** Fires one behaviour event when it mounts (and again if the identifying fields change). Renders nothing. */
export function TrackEvent(props: BehaviorEvent) {
  const key = `${props.event_type}|${props.product_id ?? ""}|${props.store_id ?? ""}|${props.search_query ?? ""}|${props.category ?? ""}`;
  useEffect(() => {
    trackBehavior(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/**
 * Wraps a promo (banner, campaign, voucher, flash sale…): logs an `impression` once half of it has been on
 * screen, and a `click` on any click inside it. Layout-neutral (`display: contents`).
 */
export function PromoTracker({
  entityType,
  entityId,
  source,
  metadata,
  children,
}: {
  entityType: string;
  entityId: string;
  source: string;
  metadata?: Record<string, unknown>;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current?.firstElementChild ?? ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackPromo({ entity_type: entityType, entity_id: entityId, event_type: "impression", source_screen: source, metadata });
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- metadata is descriptive only
  }, [entityType, entityId, source]);

  return (
    <div
      ref={ref}
      className="contents"
      onClickCapture={() => trackPromo({ entity_type: entityType, entity_id: entityId, event_type: "click", source_screen: source, metadata })}
    >
      {children}
    </div>
  );
}
