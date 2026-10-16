"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, MapPin, Package, Search } from "lucide-react";
import { StatusBadge } from "@/components/orders/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Pagination } from "@/components/ui/pagination";
import { STATUS_LABEL } from "@/libs/orders";
import { formatDate, formatMoney } from "@/libs/format";
import { useFakeMutation } from "@/mocks/mutation";
import { MOCK_VENDOR_ORDERS, type VendorOrder } from "@/mocks/vendor.mock";
import type { FulfilmentStatus } from "@/types/order";

const FILTERS: { value: FulfilmentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: STATUS_LABEL.pending },
  { value: "confirmed", label: STATUS_LABEL.confirmed },
  { value: "preparing", label: STATUS_LABEL.preparing },
  { value: "out_for_delivery", label: STATUS_LABEL.out_for_delivery },
  { value: "delivered", label: STATUS_LABEL.delivered },
  { value: "cancelled", label: STATUS_LABEL.cancelled },
];

/** The seller-facing action that advances an order to its next fulfilment step, if any. */
const NEXT_STEP: Partial<Record<FulfilmentStatus, { status: FulfilmentStatus; label: string }>> = {
  pending: { status: "confirmed", label: "Confirm order" },
  confirmed: { status: "preparing", label: "Start preparing" },
  preparing: { status: "out_for_delivery", label: "Mark shipped" },
  out_for_delivery: { status: "delivered", label: "Mark delivered" },
};

const PAGE_SIZE = 6;

function advanceOrder(input: { id: string; status: FulfilmentStatus }) {
  return input;
}

function OrderRow({ order, onSelect, onAdvance, pending }: { order: VendorOrder; onSelect: () => void; onAdvance: () => void; pending: boolean }) {
  const next = NEXT_STEP[order.status];
  const [primary, ...rest] = order.items;
  const extraQty = rest.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-4 p-5 text-left">
        <Media src={primary.imageUrl} name={primary.name} sizes="64px" className="size-16 shrink-0 rounded-xl" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold tracking-normal">Order {order.number}</h3>
              <p className="mt-0.5 truncate text-sm text-muted">
                {order.buyerName} · <time dateTime={order.placedAt}>{formatDate(order.placedAt)}</time>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={order.status} />
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-muted" aria-hidden>
                <Eye className="size-4" />
              </span>
            </div>
          </div>

          <p className="mt-2 truncate text-sm text-muted">
            {primary.name}
            {extraQty > 0 && ` +${extraQty} more item${extraQty === 1 ? "" : "s"}`}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge tone={order.paymentStatus === "paid" ? "success" : "neutral"}>{order.paymentStatus === "paid" ? "Paid" : "Refunded"}</Badge>
            <p className="font-semibold tabular-nums">{formatMoney(order.total)}</p>
          </div>
        </div>
      </button>

      {next && (
        <div className="border-t border-line p-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(event) => {
              event.stopPropagation();
              onAdvance();
            }}
            disabled={pending}
          >
            {pending ? "Updating…" : next.label}
          </Button>
        </div>
      )}
    </article>
  );
}

function OrderDetails({ order, onAdvance, pending }: { order: VendorOrder; onAdvance: () => void; pending: boolean }) {
  const next = NEXT_STEP[order.status];
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 space-y-6 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">
              Placed <time dateTime={order.placedAt}>{formatDate(order.placedAt)}</time>
            </p>
            <p className="mt-0.5 font-medium">{order.buyerName}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-normal">
            <MapPin className="size-4 text-muted" aria-hidden />
            Ship to
          </h3>
          <address className="rounded-2xl border border-line bg-surface-muted p-4 text-sm leading-6 text-muted not-italic">
            {order.buyerName}
            <br />
            {order.address.street}
            <br />
            {order.address.city}, {order.address.region}
            <br />
            {order.buyerPhone}
          </address>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold tracking-normal">Items</h3>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <Media src={item.imageUrl} name={item.name} sizes="48px" className="size-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted">
                    Qty {item.quantity} · {formatMoney(item.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.unitPrice * item.quantity)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Items subtotal</span>
            <span className="tabular-nums">{formatMoney(itemsSubtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Delivery fee</span>
            <span className="tabular-nums">{formatMoney(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(order.total)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-xs text-muted">
            <span>Payment</span>
            <Badge tone={order.paymentStatus === "paid" ? "success" : "neutral"}>{order.paymentStatus === "paid" ? "Paid" : "Refunded"}</Badge>
          </div>
        </section>
      </div>

      {next && (
        <div className="border-t border-line p-5">
          <Button type="button" size="lg" className="w-full" onClick={onAdvance} disabled={pending}>
            {pending ? "Updating…" : next.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export function VendorOrdersTab() {
  const [orders, setOrders] = useState<VendorOrder[]>(MOCK_VENDOR_ORDERS);
  const [filter, setFilter] = useState<FulfilmentStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const advanceMutation = useFakeMutation(advanceOrder);

  const counts = useMemo(() => {
    const map = new Map<FulfilmentStatus, number>();
    for (const order of orders) map.set(order.status, (map.get(order.status) ?? 0) + 1);
    return map;
  }, [orders]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      if (q && !order.number.toLowerCase().includes(q) && !order.buyerName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, filter, query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedOrder = orders.find((order) => order.id === selectedId) ?? null;

  const onAdvance = (order: VendorOrder) => {
    const next = NEXT_STEP[order.status];
    if (!next) return;
    setAdvancingId(order.id);
    advanceMutation.mutate(
      { id: order.id, status: next.status },
      {
        onSuccess: ({ status }) => {
          setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
          toast.success(`Order ${order.number} marked ${STATUS_LABEL[status].toLowerCase()}`);
          setAdvancingId(null);
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by order number or buyer"
            className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as FulfilmentStatus | "all")}
          aria-label="Filter by status"
          className="h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm focus:border-foreground focus:outline-none"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
              {f.value !== "all" && counts.get(f.value) ? ` · ${counts.get(f.value)}` : ""}
            </option>
          ))}
        </select>
      </div>

      {rows.length > 0 ? (
        <>
          <ul className="space-y-4">
            {pageRows.map((order) => (
              <li key={order.id}>
                <OrderRow
                  order={order}
                  onSelect={() => setSelectedId(order.id)}
                  onAdvance={() => onAdvance(order)}
                  pending={advancingId === order.id}
                />
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={<Package className="size-10 text-muted" aria-hidden />}
          title="No orders match"
          description="Try a different filter or search term."
        />
      )}

      <Drawer
        open={selectedOrder !== null}
        onClose={() => setSelectedId(null)}
        title={selectedOrder ? `Order ${selectedOrder.number}` : "Order"}
        labelId="vendor-order-details-heading"
      >
        {selectedOrder && <OrderDetails order={selectedOrder} onAdvance={() => onAdvance(selectedOrder)} pending={advancingId === selectedOrder.id} />}
      </Drawer>
    </div>
  );
}
