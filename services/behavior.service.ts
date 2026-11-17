import { BEHAVIOR_ENDPOINTS } from "@/libs/api-endpoint";
import { apiFetch } from "./http";

export type BehaviorEvent = {
  eventType: "product_view" | "store_view" | "search" | "category_view" | "add_to_cart";
  productId?: string | null;
  storeId?: string | null;
  category?: string | null;
  searchQuery?: string | null;
};

/**
 * What the shopper looked at. This is the *only* thing that fills the `recently_viewed` home-feed
 * section and feeds the recommendation model — without it the web would keep asking the API for a
 * history it never contributed to, and "Recently viewed" would stay permanently empty for anyone
 * who shops on the website rather than the app.
 *
 * Fire-and-forget: a dropped analytics event must never surface as an error to a shopper, so
 * failures are swallowed deliberately. Requires a session (the API attributes events to a user).
 */
export const behaviorService = {
  async record(events: BehaviorEvent[], sessionId?: string | null): Promise<void> {
    if (!events.length) return;
    try {
      await apiFetch<unknown>(BEHAVIOR_ENDPOINTS.eventsBatch, {
        method: "POST",
        body: {
          session_id: sessionId ?? null,
          events: events.slice(0, 50).map((event) => ({
            event_type: event.eventType,
            product_id: event.productId ?? null,
            store_id: event.storeId ?? null,
            category: event.category ?? null,
            search_query: event.searchQuery ?? null,
            source_screen: "web",
          })),
        },
        revalidate: false,
      });
    } catch {
      // Analytics is not worth a visible failure.
    }
  },
};
