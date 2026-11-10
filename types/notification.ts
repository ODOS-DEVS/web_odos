/** One notification as the UI shows it. `read` is derived from the account's read-state, not stored on the event. */
export type AppNotification = {
  id: string;
  /** Backend-assigned category, e.g. "account_ready", "order_update". */
  kind: string;
  title: string;
  body: string;
  imageUrl: string | null;
  /** Where tapping it should go, when the backend named a destination. */
  actionLabel: string | null;
  routeType: string | null;
  routeTargetId: string | null;
  createdAt: string;
  read: boolean;
};

export type NotificationPage = {
  items: AppNotification[];
  hasMore: boolean;
  totalCount: number;
  unreadCount: number;
};
