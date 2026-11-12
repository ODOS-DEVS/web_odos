"use client";

import { useEffect } from "react";
import { apiFetch } from "@/services/http";

/**
 * Fire-and-forget promo analytics, feeding the funnel the admin dashboard
 * already reads (impression → click → conversion on campaigns, vouchers and
 * banners). POST /promotions/events/batch accepts anonymous events and the
 * backend drops events for users who opted out of analytics, so nothing here
 * gates on login or consent — and nothing here may ever break the shopping
 * flow, so every failure is swallowed.
 */

type EntityType = "campaign" | "voucher" | "banner";
type EventType = "impression" | "click" | "conversion";

type PromoEvent = {
  entity_type: EntityType;
  entity_id: string;
  event_type: EventType;
  source_screen?: string;
  occurred_at: string;
};

const MAX_BATCH = 50;
const FLUSH_AFTER_MS = 4_000;

const queue: PromoEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
/** Impressions dedupe per page load — a re-render is not a second look. */
const seen = new Set<string>();

function sessionId(): string | undefined {
  try {
    const key = "odos-promo-session";
    let id = window.sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;
  const events = queue.splice(0, MAX_BATCH);
  try {
    await apiFetch("/promotions/events/batch", {
      method: "POST",
      body: { session_id: sessionId(), events },
      revalidate: false,
    });
  } catch {
    // Analytics never bubbles into the UI. Dropped is fine; retried is not —
    // a retry loop would double-count the funnel.
  }
  if (queue.length > 0) void flush();
}

function enqueue(event: PromoEvent) {
  if (typeof window === "undefined") return;
  queue.push(event);
  if (queue.length >= MAX_BATCH) {
    void flush();
    return;
  }
  flushTimer ??= setTimeout(() => void flush(), FLUSH_AFTER_MS);
}

if (typeof document !== "undefined") {
  // The tab going hidden is the last reliable moment to send what's queued.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
}

export function trackPromoImpression(entityType: EntityType, entityId: string, sourceScreen?: string) {
  const key = `${entityType}:${entityId}`;
  if (seen.has(key)) return;
  seen.add(key);
  enqueue({ entity_type: entityType, entity_id: entityId, event_type: "impression", source_screen: sourceScreen, occurred_at: new Date().toISOString() });
}

export function trackPromoClick(entityType: EntityType, entityId: string, sourceScreen?: string) {
  enqueue({ entity_type: entityType, entity_id: entityId, event_type: "click", source_screen: sourceScreen, occurred_at: new Date().toISOString() });
}

export function trackPromoConversion(entityType: EntityType, entityId: string, sourceScreen?: string) {
  enqueue({ entity_type: entityType, entity_id: entityId, event_type: "conversion", source_screen: sourceScreen, occurred_at: new Date().toISOString() });
}

/** Records one impression when the component carrying the entity first mounts. */
export function usePromoImpression(entityType: EntityType, entityId: string, sourceScreen?: string) {
  useEffect(() => {
    trackPromoImpression(entityType, entityId, sourceScreen);
  }, [entityType, entityId, sourceScreen]);
}
