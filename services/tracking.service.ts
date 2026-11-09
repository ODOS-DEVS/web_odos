import { apiBaseUrl, TRACKING_ENDPOINTS } from "@/libs/api-endpoint";
import { getAccessToken } from "@/libs/auth-session";

/** BehaviorEventCreate */
export type BehaviorEvent = {
  event_type: string;
  product_id?: string | null;
  store_id?: string | null;
  category?: string | null;
  search_query?: string | null;
  source_screen?: string | null;
  metadata?: Record<string, unknown> | null;
  occurred_at?: string;
};

/** PromoAnalyticsEventCreate — `event_type` is impression, click or conversion. */
export type PromoEvent = {
  entity_type: string;
  entity_id: string;
  event_type: "impression" | "click" | "conversion";
  source_screen?: string | null;
  metadata?: Record<string, unknown> | null;
  occurred_at?: string;
};

const FLUSH_MS = 8_000;
const MAX_BATCH = 50;
const SESSION_KEY = "odos.tracking-session";

const queues = { behavior: [] as BehaviorEvent[], promo: [] as PromoEvent[] };
const seenImpressions = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function sessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id.slice(0, 64);
  } catch {
    return null;
  }
}

/**
 * Plain `fetch` with `keepalive` (not axios) so a batch still goes out while the page unloads.
 * Analytics must never break the page, so every failure is swallowed.
 */
function post(path: string, events: unknown[]) {
  if (events.length === 0) return;
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    void fetch(`${apiBaseUrl()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ session_id: sessionId(), events }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // ignore
  }
}

export function flushTracking() {
  if (timer) clearTimeout(timer);
  timer = null;
  while (queues.behavior.length) post(TRACKING_ENDPOINTS.behaviorEvents, queues.behavior.splice(0, MAX_BATCH));
  while (queues.promo.length) post(TRACKING_ENDPOINTS.promoEvents, queues.promo.splice(0, MAX_BATCH));
}

function schedule() {
  if (typeof window === "undefined") return;
  if (!listening) {
    listening = true;
    window.addEventListener("pagehide", flushTracking);
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flushTracking());
  }
  if (queues.behavior.length + queues.promo.length >= MAX_BATCH) return flushTracking();
  timer ??= setTimeout(flushTracking, FLUSH_MS);
}

/** Queues a shopper behaviour event (POST /behavior/events/batch, sent in batches). */
export function trackBehavior(event: BehaviorEvent) {
  if (typeof window === "undefined") return;
  queues.behavior.push({ ...event, occurred_at: event.occurred_at ?? new Date().toISOString() });
  schedule();
}

/** Queues a promo analytics event (POST /promotions/events/batch). Impressions are counted once per page view. */
export function trackPromo(event: PromoEvent) {
  if (typeof window === "undefined") return;
  if (event.event_type === "impression") {
    const key = `${event.entity_type}:${event.entity_id}:${event.source_screen ?? ""}:${location.pathname}`;
    if (seenImpressions.has(key)) return;
    seenImpressions.add(key);
  }
  queues.promo.push({ ...event, occurred_at: event.occurred_at ?? new Date().toISOString() });
  schedule();
}
