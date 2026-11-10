"use client";

import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { RequireLogin } from "@/components/auth/require-login";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "./notification-item";

function NotificationsList() {
  const { notifications, unreadCount, isPending, isError, error, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();

  if (isPending) {
    return (
      <div className="mt-5 space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-3xl bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-5">
        <QueryError error={error} onRetry={() => refetch()} title="We couldn’t load your notifications" />
      </div>
    );
  }

  return (
    <>
      <div className="mt-10 flex items-center justify-between gap-4">
        <p className="text-sm text-muted sm:text-base">
          {unreadCount === 0 ? "You’re all caught up" : `${unreadCount} unread`}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            disabled={markRead.isPending}
            onClick={() =>
              markRead.mutate(
                { markAll: true },
                { onError: () => toast.error("We couldn't mark those as read") },
              )
            }
            className="press flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-muted disabled:opacity-60 sm:px-5 sm:text-base"
          >
            <CheckCheck className="size-4.5" aria-hidden />
            {markRead.isPending ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-6 text-muted" aria-hidden />}
          iconBadge
          title="No notifications yet"
          description="Updates about your orders and account will show up here."
          className="mt-5"
        />
      ) : (
        <div className="mt-5 space-y-3">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </>
  );
}

export function NotificationsView() {
  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Notifications</h1>
        <RequireLogin next="/notifications" message="Log in to see your notifications.">
          <NotificationsList />
        </RequireLogin>
      </div>
    </Container>
  );
}
