"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, Clock, PackageSearch, Search } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { VendorStatusBadge } from "@/components/vendor/vendor-status-badge";
import { PageHeader, SearchInput, SegmentedControl, SkeletonRows } from "@/components/vendor/vendor-ui";
import { formatDate, formatMoney } from "@/libs/format";
import {
  VENDOR_ORDER_QUEUES,
  VENDOR_ORDER_STATUS_LABELS,
  canCancelVendorOrder,
  countVendorOrdersByQueue,
  filterVendorOrdersByQueue,
  formatVendorOrderWaitLabel,
  getVendorOrderNextActionLabel,
  getVendorOrderNextStatus,
  isVendorOrderOverdue,
  type VendorOrderQueue,
} from "@/libs/vendor-orders";
import { useAdvanceVendorOrder, useVendorOrders } from "@/hooks/use-vendor";
import { VendorCancelOrderDialog } from "./vendor-cancel-order-dialog";
import { VendorCancellationRequests } from "./vendor-cancellation-requests";
import type { VendorOrder } from "@/types/vendor";

const PAGE_SIZE = 10;

function OrderRow({
  order,
  onAdvance,
  onCancel,
  pending,
}: {
  order: VendorOrder;
  onAdvance: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const nextLabel = getVendorOrderNextActionLabel(order.status);
  const [primary, ...rest] = order.items;
  const extraQty = rest.reduce((sum, item) => sum + item.quantity, 0);
  const overdue = isVendorOrderOverdue(order);

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <Media src={primary?.imageUrl ?? null} name={primary?.name ?? "Item"} sizes="56px" className="size-14 shrink-0 rounded-xl" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <Link href={`/seller/orders/${order.id}`} className="press min-w-0 group">
              <h3 className="truncate font-semibold tracking-normal group-hover:text-accent">Order {order.number}</h3>
              <p className="mt-0.5 truncate text-sm text-muted">
                {order.buyerName} · <time dateTime={order.placedAt}>{formatDate(order.placedAt)}</time>
              </p>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <VendorStatusBadge status={order.status} />
            </div>
          </div>

          <p className="mt-2 truncate text-sm text-muted">
            {primary?.name ?? "No items"}
            {extraQty > 0 && ` +${extraQty} more item${extraQty === 1 ? "" : "s"}`}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {order.packageCount > 1 && (
              <Badge tone="neutral">
                Bag {order.packageNumber} of {order.packageCount}
              </Badge>
            )}
            {overdue && (
              <Badge tone="danger">
                <Clock className="size-3.5" aria-hidden />
                {formatVendorOrderWaitLabel(order)}
              </Badge>
            )}
            <Badge tone={order.isSettled ? "success" : "neutral"}>{order.isSettled ? "Settled" : "Awaiting settlement"}</Badge>
            <span className="ml-auto font-semibold tabular-nums">{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <ButtonLink href={`/seller/orders/${order.id}`} variant="ghost" size="sm">
          View details
          <ChevronRight className="size-4" aria-hidden />
        </ButtonLink>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canCancelVendorOrder(order.status) && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          )}
          {nextLabel && (
            <Button type="button" size="sm" onClick={onAdvance} disabled={pending}>
              {pending ? "Updating…" : nextLabel}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function VendorOrdersView() {
  const ordersQuery = useVendorOrders();
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  const [queue, setQueue] = useState<VendorOrderQueue>("new");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<VendorOrder | null>(null);

  const advance = useAdvanceVendorOrder();
  const counts = useMemo(() => countVendorOrdersByQueue(orders), [orders]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inQueue = filterVendorOrdersByQueue(orders, queue);
    if (!q) return inQueue;
    return inQueue.filter(
      (order) => order.number.toLowerCase().includes(q) || order.buyerName.toLowerCase().includes(q),
    );
  }, [orders, queue, query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Clamped during render so shrinking results never strand the viewer on an empty page.
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const run = (order: VendorOrder, status: Parameters<typeof advance.mutate>[0]["status"], message: string) => {
    setBusyId(order.id);
    advance.mutate(
      { orderId: order.id, status },
      {
        onSuccess: () => toast.success(message),
        onError: (error) => toast.error(error instanceof Error ? error.message : `We couldn't update order ${order.number}`),
        onSettled: () => setBusyId(null),
      },
    );
  };

  const onAdvance = (order: VendorOrder) => {
    const next = getVendorOrderNextStatus(order.status);
    if (!next) return;
    run(order, next, `Order ${order.number} is now ${VENDOR_ORDER_STATUS_LABELS[next].toLowerCase()}`);
  };

  if (ordersQuery.isError) {
    return <QueryError title="We couldn't load your orders" error={ordersQuery.error} onRetry={() => ordersQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Confirm, prepare and dispatch the orders customers have placed with your store."
      />

      <VendorCancellationRequests orders={orders} />

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Order queue"
          value={queue}
          onChange={(next) => {
            setQueue(next);
            setPage(1);
          }}
          options={VENDOR_ORDER_QUEUES.map((q) => ({ value: q.id, label: q.label, count: counts[q.id] }))}
        />
        <SearchInput
          value={query}
          onChange={(next) => {
            setQuery(next);
            setPage(1);
          }}
          label="Search orders"
          placeholder="Search by order number or customer"
          icon={<Search className="size-4" aria-hidden />}
        />
      </div>

      {ordersQuery.isPending ? (
        <SkeletonRows count={4} />
      ) : rows.length > 0 ? (
        <>
          <ul className="space-y-4">
            {pageRows.map((order) => (
              <li key={order.id}>
                <OrderRow
                  order={order}
                  pending={busyId === order.id}
                  onAdvance={() => onAdvance(order)}
                  onCancel={() => setCancelling(order)}
                />
              </li>
            ))}
          </ul>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={<PackageSearch className="size-10 text-muted" aria-hidden />}
          title={query ? "No orders match" : `No ${queue} orders`}
          description={
            query
              ? "Try a different order number or customer name."
              : queue === "new"
                ? "New orders will appear here as soon as customers check out."
                : "Nothing in this queue right now."
          }
        />
      )}

      <VendorCancelOrderDialog
        order={cancelling}
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
      />

    </div>
  );
}
