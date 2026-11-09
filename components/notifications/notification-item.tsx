import { Bell } from "lucide-react";
import { cn } from "@/libs/cn";
import type { NotificationItem as NotificationItemData } from "./notification-data";

export function NotificationItem({
  notification,
  compact = false,
  unread = true,
}: {
  notification: NotificationItemData;
  compact?: boolean;
  unread?: boolean;
}) {
  return (
    <article
      className={
        compact
          ? "flex gap-3 border-t border-line px-4 py-4"
          : "flex gap-4 rounded-3xl border border-line bg-surface p-5 sm:items-center sm:px-6"
      }
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-accent-soft text-accent",
          compact ? "size-10" : "size-12 sm:size-13",
        )}
      >
        <Bell className={compact ? "size-4" : "size-5"} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn("flex items-start", compact ? "gap-2" : "gap-3")}>
          <h2 className={cn("min-w-0 flex-1 font-bold tracking-normal", compact ? "text-sm" : "text-base sm:text-lg")}>
            {notification.title}
          </h2>
          <time className={cn("shrink-0 text-muted", compact ? "text-[11px]" : "text-xs sm:text-sm")}>
            {notification.date}
          </time>
          {unread && (
            <span
              className={cn("shrink-0 rounded-full bg-accent", compact ? "mt-1 size-2" : "mt-1.5 size-2.5")}
              aria-label="Unread"
            />
          )}
        </div>
        <p className={cn("mt-1 text-muted", compact ? "text-xs leading-5" : "text-sm leading-6 sm:text-base")}>
          {notification.description}
        </p>
      </div>
    </article>
  );
}
