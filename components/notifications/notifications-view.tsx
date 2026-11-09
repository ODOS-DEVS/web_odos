"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { RequireLogin } from "@/components/auth/require-login";
import { NotificationRow } from "@/components/layout/notifications-button";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { useMarkNotificationsRead, useNotificationsList } from "@/hooks/use-notifications";
import type { AppNotification } from "@/services/notifications.service";

function NotificationsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex animate-pulse items-start gap-3 rounded-2xl border border-line bg-surface p-4">
          <div className="size-9 shrink-0 rounded-full bg-surface-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-48 rounded bg-surface-muted" />
            <div className="h-3 w-72 max-w-full rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsList() {
  const router = useRouter();
  const list = useNotificationsList();
  const markRead = useMarkNotificationsRead();
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const unread = list.data?.pages[0]?.unread ?? 0;

  const open = (n: AppNotification) => {
    if (!n.read) markRead.mutate({ keys: [n.id] });
    if (n.href) router.push(n.href);
  };

  if (list.isPending) return <NotificationsSkeleton />;
  if (list.isError) return <QueryError error={list.error} onRetry={() => list.refetch()} title="We couldn’t load your notifications" />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="size-10 text-muted" aria-hidden />}
        title="No notifications yet"
        description="Order updates, deals and messages will show up here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={() => markRead.mutate({ all: true })} disabled={markRead.isPending}>
            <CheckCheck className="mr-1.5 size-4" aria-hidden /> Mark all read
          </Button>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            <NotificationRow notification={n} onOpen={() => open(n)} />
          </li>
        ))}
      </ul>
      {list.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
            {list.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function NotificationsView() {
  return (
    <Container className="max-w-2xl py-8 sm:py-12">
      <h1 className="mb-6 text-3xl font-semibold sm:text-4xl">Notifications</h1>
      <RequireLogin next="/notifications" message="Log in to see your notifications." fallback={<NotificationsSkeleton />}>
        <NotificationsList />
      </RequireLogin>
    </Container>
  );
}
