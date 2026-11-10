"use client";

import Link from "next/link";
import { useRef } from "react";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationItem } from "@/components/notifications/notification-item";
import { useDetailsDismiss } from "@/hooks/use-details-dismiss";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/use-notifications";

/** Only the newest few fit in the dropdown; the rest live on /notifications. */
const PREVIEW_COUNT = 4;

export function NotificationsButton() {
  const menu = useRef<HTMLDetailsElement>(null);
  useDetailsDismiss(menu);
  const close = () => menu.current?.removeAttribute("open");

  const { notifications, unreadCount, isPending } = useNotifications();
  const markRead = useMarkNotificationsRead();

  return (
    <details ref={menu} className="group relative">
      <summary
        className="press relative grid size-9 cursor-pointer list-none place-items-center rounded-full marker:hidden hover:bg-surface-muted min-[320px]:size-10 [&::-webkit-details-marker]:hidden"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      >
        <Bell className="size-4.5 min-[320px]:size-5" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] leading-4 font-semibold text-accent-foreground tabular-nums min-[320px]:-top-0.5 min-[320px]:-right-0.5 min-[320px]:min-w-5 min-[320px]:text-[11px] min-[320px]:leading-5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </summary>

      <div className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-[1.35rem] border border-line bg-surface shadow-[0_20px_55px_rgba(22,20,15,0.16)]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2 className="text-sm font-bold tracking-normal">Notifications</h2>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={markRead.isPending}
              onClick={() =>
                markRead.mutate({ markAll: true }, { onError: () => toast.error("We couldn't mark those as read") })
              }
              className="press flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-60"
            >
              <CheckCheck className="size-3.5" aria-hidden />
              Mark all read
            </button>
          )}
        </div>

        <div className="bg-accent-soft/35">
          {isPending ? (
            <div className="space-y-2 p-4" aria-busy="true">
              {[0, 1].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-muted" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">Nothing yet.</p>
          ) : (
            notifications
              .slice(0, PREVIEW_COUNT)
              .map((notification) => <NotificationItem key={notification.id} notification={notification} compact />)
          )}
        </div>

        <Link
          href="/notifications"
          onClick={close}
          className="press block px-4 py-3 text-center text-sm font-semibold hover:bg-surface-muted"
        >
          See all notifications
        </Link>
      </div>
    </details>
  );
}
