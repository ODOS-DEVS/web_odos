import { NOTIFICATIONS_ENDPOINTS } from "@/libs/api-endpoint";
import type { AppNotification, NotificationPage } from "@/types/notification";
import { apiFetch } from "./http";

type NotificationEventRead = {
  id: string;
  kind: string;
  title: string;
  body: string;
  action_label?: string | null;
  route_type?: string | null;
  route_target_id?: string | null;
  image_url?: string | null;
  created_at: string;
};

type NotificationPageRead = {
  items: NotificationEventRead[];
  has_more: boolean;
  total_count: number;
  unread_count: number;
};

/** Read state is a separate list of keys, and the keys are notification ids. */
type NotificationReadState = {
  read_keys: string[];
  unread_count: number;
};

const normalise = (key: string) => key.trim().toLowerCase();

function toNotification(n: NotificationEventRead, readKeys: Set<string>): AppNotification {
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    imageUrl: n.image_url ?? null,
    actionLabel: n.action_label ?? null,
    routeType: n.route_type ?? null,
    routeTargetId: n.route_target_id ?? null,
    createdAt: n.created_at,
    read: readKeys.has(normalise(n.id)),
  };
}

export const notificationsService = {
  /**
   * The notification list, with each item's read flag resolved.
   *
   * Whether an event has been read lives in a separate read-state list keyed by notification id,
   * so both are fetched together — the list alone cannot say what is unread.
   */
  async list(limit = 20): Promise<NotificationPage> {
    const [page, state] = await Promise.all([
      apiFetch<NotificationPageRead>(NOTIFICATIONS_ENDPOINTS.notifications, { query: { limit }, revalidate: false }),
      apiFetch<NotificationReadState>(NOTIFICATIONS_ENDPOINTS.readState, { revalidate: false }),
    ]);

    const readKeys = new Set((state.read_keys ?? []).map(normalise));
    return {
      items: (page.items ?? []).map((item) => toNotification(item, readKeys)),
      hasMore: Boolean(page.has_more),
      totalCount: page.total_count ?? 0,
      // The read-state endpoint is the authority on the badge count.
      unreadCount: state.unread_count ?? page.unread_count ?? 0,
    };
  },

  /** Marks specific notifications read, or everything when `markAll` is set. */
  markRead: (input: { keys?: string[]; markAll?: boolean }) =>
    apiFetch<NotificationReadState>(NOTIFICATIONS_ENDPOINTS.readState, {
      method: "POST",
      body: { keys: input.keys ?? [], mark_all: Boolean(input.markAll) },
    }),
};
