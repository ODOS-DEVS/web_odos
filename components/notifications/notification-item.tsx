"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  MessageSquare,
  Package,
  PackageX,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/libs/cn";
import { formatChatListTime } from "@/libs/format";
import { notificationHref, notificationTone, type NotificationTone } from "@/libs/notification-routes";
import { useMarkNotificationsRead } from "@/hooks/use-notifications";
import type { AppNotification } from "@/types/notification";

const TONE_STYLE: Record<NotificationTone, { icon: LucideIcon; className: string }> = {
  order: { icon: Package, className: "bg-accent-soft text-accent" },
  money: { icon: Wallet, className: "bg-success-soft text-success" },
  message: { icon: MessageSquare, className: "bg-surface-muted text-foreground" },
  promo: { icon: Tag, className: "bg-warning-soft text-warning" },
  stock: { icon: PackageX, className: "bg-danger-soft text-danger" },
  account: { icon: Bell, className: "bg-accent-soft text-accent" },
};

/**
 * One notification row.
 *
 * It used to be a plain `<article>`: not clickable, never marked itself read, and showed the
 * same bell for everything while the API was already sending `kind`, `route_type` and
 * `route_target_id`. Clicking a notification genuinely did nothing.
 *
 * Now the row is a link when the backend named a destination, marks itself read on the way
 * there, and takes its icon from what the notification is actually about. A notification with no
 * mappable destination stays a non-interactive article rather than becoming a dead link.
 */
export function NotificationItem({
  notification,
  compact = false,
  unread,
}: {
  notification: AppNotification;
  compact?: boolean;
  /** Defaults to the notification's own read state; pass it only to override. */
  unread?: boolean;
}) {
  const markRead = useMarkNotificationsRead();
  const isUnread = unread ?? !notification.read;
  const href = notificationHref(notification);
  const { icon: Icon, className: iconClass } = TONE_STYLE[notificationTone(notification)];

  // Fire-and-forget: navigation must not wait on the read-state write, and a failed mark is not
  // worth interrupting the journey for.
  const markOnOpen = () => {
    if (isUnread) markRead.mutate({ keys: [notification.id] });
  };

  const body = (
    <>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full",
          iconClass,
          compact ? "size-10" : "size-12 sm:size-13",
        )}
      >
        <Icon className={compact ? "size-4" : "size-5"} aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn("flex items-start", compact ? "gap-2" : "gap-3")}>
          <span className={cn("min-w-0 flex-1 font-bold tracking-normal", compact ? "text-sm" : "text-base sm:text-lg")}>
            {notification.title}
          </span>
          <time
            dateTime={notification.createdAt}
            className={cn("shrink-0 text-muted", compact ? "text-[11px]" : "text-xs sm:text-sm")}
          >
            {formatChatListTime(notification.createdAt)}
          </time>
          {isUnread && (
            <span
              className={cn("shrink-0 rounded-full bg-accent", compact ? "mt-1 size-2" : "mt-1.5 size-2.5")}
              aria-label="Unread"
            />
          )}
        </span>

        <span className={cn("mt-1 block text-muted", compact ? "text-xs leading-5" : "text-sm leading-6 sm:text-base")}>
          {notification.body}
        </span>

        {href && notification.actionLabel && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-accent">
            {notification.actionLabel}
            <ChevronRight className="size-3.5" aria-hidden />
          </span>
        )}
      </span>
    </>
  );

  const shell = compact
    ? "flex gap-3 border-t border-line px-4 py-4"
    : "flex gap-4 rounded-3xl border border-line bg-surface p-5 sm:items-center sm:px-6";

  if (!href) {
    return <article className={cn(shell, isUnread && !compact && "border-accent/40")}>{body}</article>;
  }

  return (
    <Link
      href={href}
      onClick={markOnOpen}
      className={cn(shell, "press text-left hover:border-foreground", isUnread && !compact && "border-accent/40")}
    >
      {body}
    </Link>
  );
}
