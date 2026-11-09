import { NOTIFICATIONS_ENDPOINTS } from "@/libs/api-endpoint";
import type { UserRead } from "@/types/api";
import { apiFetch } from "./http";

/** NotificationEventRead */
export type AppNotification = {
  /** Stable key used for read state (the event id). */
  id: string;
  kind: string;
  title: string;
  body: string;
  icon: string;
  accent: string;
  actionLabel: string | null;
  routeType: string | null;
  routeTargetId: string | null;
  imageUrl: string | null;
  createdAt: string;
  read: boolean;
  /** Where tapping the notification should go on the web, when it maps to a page. */
  href: string | null;
};

export type NotificationPage = {
  items: AppNotification[];
  hasMore: boolean;
  total: number;
  unread: number;
};

type NotificationEventRead = {
  id: string;
  kind: string;
  title: string;
  body: string;
  icon: string;
  accent: string;
  action_label: string | null;
  route_type: string | null;
  route_target_id: string | null;
  image_key: string | null;
  image_url: string | null;
  created_at: string;
};

type NotificationPageRead = { items: NotificationEventRead[]; has_more: boolean; total_count: number; unread_count: number };
type NotificationReadState = { read_keys: string[]; unread_count: number };

/** Maps the app's route types onto storefront URLs. Unknown types just don't link. */
function hrefFor(type: string | null, id: string | null): string | null {
  const t = (type ?? "").toLowerCase();
  const target = id ? encodeURIComponent(id) : null;
  if (/order/.test(t)) return target ? `/orders/${target}` : "/orders";
  if (/product/.test(t) && target) return `/products/${target}`;
  if (/store|vendor_store/.test(t) && target) return `/stores/${target}`;
  if (/flash/.test(t)) return target ? `/flash-sales/${target}` : "/flash-sales";
  if (/voucher|promo|coupon/.test(t)) return "/account?tab=vouchers";
  if (/loyalty|points|reward/.test(t)) return "/account?tab=loyalty";
  if (/wallet|refund/.test(t)) return "/account?tab=wallet";
  if (/return/.test(t)) return "/account?tab=returns";
  if (/chat|message|support/.test(t)) return "/account?tab=chats";
  if (/review/.test(t)) return "/account?tab=reviews";
  if (/seller|vendor/.test(t)) return "/seller";
  return null;
}

const toNotification = (n: NotificationEventRead, readKeys: Set<string>): AppNotification => ({
  id: n.id,
  kind: n.kind,
  title: n.title,
  body: n.body,
  icon: n.icon,
  accent: n.accent,
  actionLabel: n.action_label,
  routeType: n.route_type,
  routeTargetId: n.route_target_id,
  imageUrl: n.image_url,
  createdAt: n.created_at,
  read: readKeys.has(n.id),
  href: hrefFor(n.route_type, n.route_target_id),
});

/** In-app notifications (login required). Read state is kept server-side as a set of keys. */
export const notificationsService = {
  async page(limit = 25, offset = 0): Promise<NotificationPage> {
    const [page, state] = await Promise.all([
      apiFetch<NotificationPageRead>(NOTIFICATIONS_ENDPOINTS.notifications, { query: { limit, offset }, revalidate: false }),
      apiFetch<NotificationReadState>(NOTIFICATIONS_ENDPOINTS.readState, { revalidate: false }).catch(() => null),
    ]);
    const readKeys = new Set(state?.read_keys ?? []);
    return {
      items: page.items.map((n) => toNotification(n, readKeys)),
      hasMore: page.has_more,
      total: page.total_count,
      unread: page.unread_count,
    };
  },

  readState: () => apiFetch<NotificationReadState>(NOTIFICATIONS_ENDPOINTS.readState, { revalidate: false }),

  /** Marks specific notifications read, or everything with `all`. */
  markRead: (input: { keys?: string[]; all?: boolean }) =>
    apiFetch<NotificationReadState>(NOTIFICATIONS_ENDPOINTS.readState, {
      method: "POST",
      body: { keys: input.keys ?? [], mark_all: Boolean(input.all) },
    }),

  /** Registers an Expo push token for this account (the mobile app's push channel). */
  savePushToken: (expoPushToken: string) =>
    apiFetch<UserRead>(NOTIFICATIONS_ENDPOINTS.pushToken, { method: "POST", body: { expo_push_token: expoPushToken } }),

  clearPushToken: () => apiFetch<UserRead>(NOTIFICATIONS_ENDPOINTS.pushToken, { method: "DELETE" }),
};
