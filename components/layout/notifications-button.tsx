"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationItem } from "@/components/notifications/notification-item";
import { notifications } from "@/components/notifications/notification-data";
import { useDetailsDismiss } from "@/hooks/use-details-dismiss";

export function NotificationsButton() {
  const menu = useRef<HTMLDetailsElement>(null);
  const [read, setRead] = useState(false);
  useDetailsDismiss(menu);
  const close = () => menu.current?.removeAttribute("open");

  return (
    <details ref={menu} className="group relative">
      <summary
        className="press relative grid size-9 cursor-pointer list-none place-items-center rounded-full marker:hidden hover:bg-surface-muted min-[320px]:size-10 [&::-webkit-details-marker]:hidden"
        aria-label={read ? "Notifications" : `${notifications.length} unread notifications`}
      >
        <Bell className="size-4.5 min-[320px]:size-5" aria-hidden />
        {!read && (
          <span className="absolute top-0 right-0 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] leading-4 font-semibold text-accent-foreground tabular-nums min-[320px]:-top-0.5 min-[320px]:-right-0.5 min-[320px]:min-w-5 min-[320px]:text-[11px] min-[320px]:leading-5">
            {notifications.length}
          </span>
        )}
      </summary>

      <div className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-[1.35rem] border border-line bg-surface shadow-[0_20px_55px_rgba(22,20,15,0.16)]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2 className="text-sm font-bold tracking-normal">Notifications</h2>
          <button
            type="button"
            onClick={() => setRead(true)}
            className="press flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <CheckCheck className="size-3.5" aria-hidden />
            Mark all read
          </button>
        </div>

        <div className="bg-accent-soft/35">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} compact unread={!read} />
          ))}
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
