"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useSession } from "@/hooks/use-auth";
import { useMarkNotificationsRead, useNotificationsPreview } from "@/hooks/use-notifications";
import { cn } from "@/libs/cn";
import { formatChatListTime } from "@/libs/format";
import type { AppNotification } from "@/services/notifications.service";

export function NotificationRow({ notification, onOpen, compact }: { notification: AppNotification; onOpen: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "press flex w-full items-start gap-3 text-left hover:bg-surface-muted",
        compact ? "px-4 py-3" : "rounded-2xl border border-line bg-surface p-4",
        !notification.read && (compact ? "bg-accent-soft/40" : "border-accent/30"),
      )}
    >
      <span
        className="mt-0.5 grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft text-accent"
        style={notification.accent && /^#|^rgb/.test(notification.accent) ? { color: notification.accent } : undefined}
        aria-hidden
      >
        {notification.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote icon of unknown host
          <img src={notification.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <Bell className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn("text-sm", notification.read ? "font-medium" : "font-semibold")}>{notification.title}</span>
          <span className="shrink-0 text-[11px] text-muted">{formatChatListTime(notification.createdAt)}</span>
        </span>
        <span className={cn("mt-0.5 block text-xs leading-5 text-muted", compact && "line-clamp-2")}>{notification.body}</span>
        {!compact && notification.actionLabel && notification.href && (
          <span className="mt-2 inline-block text-xs font-semibold text-accent">{notification.actionLabel} →</span>
        )}
      </span>
      {!notification.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
    </button>
  );
}

/** Header bell: unread badge + a dropdown of the latest notifications (GET /notifications). */
export function NotificationsButton() {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const preview = useNotificationsPreview();
  const markRead = useMarkNotificationsRead();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session) return null;

  const unread = preview.data?.unread ?? 0;
  const items = preview.data?.items ?? [];

  const openItem = (n: AppNotification) => {
    if (!n.read) markRead.mutate({ keys: [n.id] });
    setOpen(false);
    router.push(n.href ?? "/notifications");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="press relative grid size-9 place-items-center rounded-full hover:bg-surface-muted min-[320px]:size-10"
      >
        <Bell className="size-4.5 min-[320px]:size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground tabular-nums">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead.mutate({ all: true })}
                className="flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
              >
                <CheckCheck className="size-3.5" aria-hidden /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 divide-y divide-line overflow-y-auto">
            {preview.isPending ? (
              <div className="space-y-2 p-4" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-muted" />
                ))}
              </div>
            ) : preview.isError ? (
              <p className="p-6 text-center text-sm text-muted">We couldn’t load notifications.</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">You’re all caught up.</p>
            ) : (
              items.map((n) => <NotificationRow key={n.id} notification={n} compact onOpen={() => openItem(n)} />)
            )}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-3 text-center text-sm font-medium hover:bg-surface-muted">
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
