"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { PageHeader, Panel, SegmentedControl, SkeletonRows } from "@/components/vendor/vendor-ui";
import { cn } from "@/libs/cn";
import { formatDate } from "@/libs/format";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/use-notifications";
import type { AppNotification } from "@/types/notification";

/**
 * ODOS has one notification feed per user, not a separate vendor one, so seller events are
 * picked out by `kind`. Matching on prefixes rather than an exhaustive list means a kind added
 * on the backend shows up here without a web change.
 */
const SELLER_KIND_PREFIXES = ["vendor_", "withdrawal_", "payout_", "stock_", "inventory_", "product_", "review_", "voucher_"];
const SELLER_KINDS = new Set(["order_placed", "order_cancelled", "customer_payment_received", "platform_commission_earned"]);

const isSellerNotification = (n: AppNotification) =>
  SELLER_KINDS.has(n.kind) || SELLER_KIND_PREFIXES.some((prefix) => n.kind.startsWith(prefix));

/** Where a notification should take the vendor, by the route the API names. */
function hrefFor(n: AppNotification): string | null {
  if (n.routeType === "order" && n.routeTargetId) return `/seller/orders/${n.routeTargetId}`;
  if (n.routeType === "product" && n.routeTargetId) return `/seller/products/${n.routeTargetId}`;
  if (n.kind.startsWith("withdrawal_") || n.kind.startsWith("payout_")) return "/seller/wallet";
  if (n.kind.startsWith("review_")) return "/seller/reviews";
  if (n.kind.startsWith("voucher_")) return "/seller/vouchers";
  if (n.kind.startsWith("stock_") || n.kind.startsWith("inventory_")) return "/seller/inventory";
  if (n.kind.startsWith("vendor_order") || n.kind.startsWith("order_")) return "/seller/orders";
  return null;
}

function Row({ notification }: { notification: AppNotification }) {
  const href = hrefFor(notification);
  const body = (
    <div className={cn("flex gap-3 px-5 py-4", !notification.read && "bg-accent-soft/40")}>
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", notification.read ? "bg-transparent" : "bg-accent")} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{notification.title}</p>
        <p className="mt-0.5 text-sm text-muted">{notification.body}</p>
        <p className="mt-1 text-xs text-muted">
          <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
          {!notification.read && <span className="ml-2 text-accent">New</span>}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="press block hover:bg-surface-muted">
      {body}
    </Link>
  ) : (
    body
  );
}

export function VendorNotificationsView() {
  const { notifications, isPending, isError, error, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const sellerRows = useMemo(() => notifications.filter(isSellerNotification), [notifications]);
  const unread = sellerRows.filter((n) => !n.read);
  const rows = filter === "unread" ? unread : sellerRows;

  if (isError) {
    return <QueryError title="We couldn't load your notifications" error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Orders, payouts, stock and reviews — everything ODOS has told you about your store."
        actions={
          unread.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markRead.isPending}
              onClick={() => markRead.mutate({ keys: unread.map((n) => n.id) })}
            >
              <CheckCheck className="size-4" aria-hidden />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Notification filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: sellerRows.length },
            { value: "unread", label: "Unread", count: unread.length },
          ]}
        />
        {notifications.length > sellerRows.length && (
          <Badge tone="neutral">
            {notifications.length - sellerRows.length} shopper notification
            {notifications.length - sellerRows.length === 1 ? "" : "s"} on your account
          </Badge>
        )}
      </div>

      {isPending ? (
        <SkeletonRows count={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-10 text-muted" aria-hidden />}
          title={filter === "unread" ? "Nothing unread" : "No seller notifications yet"}
          description={
            filter === "unread"
              ? "You're all caught up."
              : "Order, payout and stock alerts for your store will appear here."
          }
        />
      ) : (
        <Panel>
          <div className="divide-y divide-line">
            {rows.map((notification) => (
              <Row key={notification.id} notification={notification} />
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
