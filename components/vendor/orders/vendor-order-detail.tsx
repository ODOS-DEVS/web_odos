"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  BellRing,
  Camera,
  Check,
  MapPin,
  PackageX,
  Phone,
  Printer,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VendorCancelOrderDialog } from "./vendor-cancel-order-dialog";
import { VendorCancellationRequests } from "./vendor-cancellation-requests";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { VendorStatusBadge } from "@/components/vendor/vendor-status-badge";
import { Panel, PanelHeader } from "@/components/vendor/vendor-ui";
import { cn } from "@/libs/cn";
import { formatDate, formatDateTime, formatMoney } from "@/libs/format";
import {
  VENDOR_ORDER_STATUS_LABELS,
  VENDOR_ORDER_TIMELINE,
  canCancelVendorOrder,
  formatVendorDeliveryMethod,
  formatVendorOrderWaitLabel,
  getVendorOrderNextActionLabel,
  getVendorOrderNextStatus,
  isVendorOrderOpen,
  isVendorOrderOverdue,
} from "@/libs/vendor-orders";
import {
  useAdvanceVendorOrder,
  useNotifyDeparture,
  useRequestCourier,
  useUploadDispatchPhoto,
  useVendorOrders,
} from "@/hooks/use-vendor";
import type { VendorOrder } from "@/types/vendor";

/** The ladder, with everything up to the current step marked done. */
function Timeline({ order }: { order: VendorOrder }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-center gap-2 px-5 py-4 text-sm text-muted">
        <PackageX className="size-4 text-danger" aria-hidden />
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = VENDOR_ORDER_TIMELINE.indexOf(order.status);
  return (
    <ol className="space-y-0 px-5 py-4">
      {VENDOR_ORDER_TIMELINE.map((step, i) => {
        const done = i <= currentIndex;
        const current = i === currentIndex;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[10px]",
                  done ? "border-accent bg-accent text-accent-foreground" : "border-line text-muted",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              {i < VENDOR_ORDER_TIMELINE.length - 1 && (
                <span className={cn("h-7 w-px", i < currentIndex ? "bg-accent" : "bg-line")} />
              )}
            </div>
            <p className={cn("pb-1 text-sm", current ? "font-semibold" : done ? "text-foreground" : "text-muted")}>
              {VENDOR_ORDER_STATUS_LABELS[step]}
              {current && <span className="ml-2 text-xs font-normal text-muted">current</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function VendorOrderDetail({ orderId }: { orderId: string }) {
  const query = useVendorOrders();
  const advance = useAdvanceVendorOrder();
  const dispatchPhoto = useUploadDispatchPhoto();
  const notifyDeparture = useNotifyDeparture();
  const requestCourier = useRequestCourier();

  const [cancelling, setCancelling] = useState(false);
  const [courierPrompt, setCourierPrompt] = useState(false);

  if (query.isError) {
    return <QueryError title="We couldn't load this order" error={query.error} onRetry={() => query.refetch()} />;
  }
  if (query.isPending) {
    return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  }

  const order = query.data?.find((o) => o.id === orderId);
  if (!order) {
    return (
      <EmptyState
        icon={<PackageX className="size-10 text-muted" aria-hidden />}
        title="Order not found"
        description="This order isn't on your store. It may belong to another vendor."
        action={<ButtonLink href="/seller/orders">Back to orders</ButtonLink>}
      />
    );
  }

  const itemsSubtotal = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const nextLabel = getVendorOrderNextActionLabel(order.status);
  const busy = advance.isPending || dispatchPhoto.isPending || notifyDeparture.isPending || requestCourier.isPending;

  const onAdvance = () => {
    const next = getVendorOrderNextStatus(order.status);
    if (!next) return;
    advance.mutate(
      { orderId: order.id, status: next },
      {
        onSuccess: () => toast.success(`Order ${order.number} is now ${VENDOR_ORDER_STATUS_LABELS[next].toLowerCase()}`),
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't update this order."),
      },
    );
  };

  return (
    <div className="space-y-5">
      <Link href="/seller/orders" className="press inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All orders
      </Link>

      {/* Scoped to this order, so the decision sits with the order it concerns. */}
      <VendorCancellationRequests orders={[order]} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Order {order.number}</h2>
          <p className="mt-1 text-sm text-muted">
            Placed <time dateTime={order.placedAt}>{formatDate(order.placedAt)}</time>
            {order.packageCount > 1 && ` · bag ${order.packageNumber} of ${order.packageCount}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <VendorStatusBadge status={order.status} />
          {isVendorOrderOverdue(order) && <Badge tone="danger">{formatVendorOrderWaitLabel(order)}</Badge>}
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            Print
          </Button>
        </div>
      </div>

      {order.packageCount > 1 && (
        <p className="rounded-2xl bg-surface-muted p-4 text-sm text-muted">
          This order has items from {order.packageCount} shops. Everything below is your bag only — the customer may ask
          about items another vendor is fulfilling.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel>
            <PanelHeader title={`Items (${order.productCount})`} />
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-4">
                  <Media src={item.imageUrl} name={item.name} sizes="48px" className="size-12 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Qty {item.quantity} · {formatMoney(item.unitPrice)} each
                      {(item.size || item.color) && (
                        <> · {[item.color, item.size].filter(Boolean).join(" / ")}</>
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.unitPrice * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Items subtotal</dt>
                <dd className="tabular-nums">{formatMoney(itemsSubtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Delivery fee (yours to keep)</dt>
                <dd className="tabular-nums">{formatMoney(order.deliveryFee)}</dd>
              </div>
              {order.commissionAmount !== null && (
                <div className="flex justify-between text-muted">
                  <dt>Platform commission</dt>
                  <dd className="tabular-nums">−{formatMoney(order.commissionAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <dt>Order total</dt>
                <dd className="tabular-nums">{formatMoney(order.total)}</dd>
              </div>
              {order.netAmount !== null && (
                <div className="flex justify-between font-semibold text-success">
                  <dt>You receive</dt>
                  <dd className="tabular-nums">{formatMoney(order.netAmount)}</dd>
                </div>
              )}
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title="Fulfilment" />
            <Timeline order={order} />
            {order.timeline.length > 0 && (
              <ul className="space-y-2 border-t border-line px-5 py-4 text-xs text-muted">
                {order.timeline.map((event) => (
                  <li key={event.id} className="flex justify-between gap-3">
                    <span>
                      {event.label}
                      {event.actorRole && <span className="text-muted/70"> by {event.actorRole}</span>}
                      {event.note && ` — ${event.note}`}
                    </span>
                    <time dateTime={event.occurredAt} className="shrink-0">
                      {formatDateTime(event.occurredAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Deliver to" />
            <div className="space-y-3 px-5 py-4 text-sm">
              <p className="font-medium">{order.buyerName}</p>
              <address className="flex gap-2 text-muted not-italic">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {[order.address.street, order.address.city, order.address.region].filter(Boolean).join(", ") ||
                    "No address on file"}
                </span>
              </address>
              {order.buyerPhone && (
                <a href={`tel:${order.buyerPhone.replace(/[^\d+]/g, "")}`} className="press flex items-center gap-2 text-accent">
                  <Phone className="size-4 shrink-0" aria-hidden />
                  {order.buyerPhone}
                </a>
              )}
              <p className="flex items-center gap-2 text-muted">
                <Truck className="size-4 shrink-0" aria-hidden />
                {formatVendorDeliveryMethod(order.deliveryMethod)}
              </p>
              {order.deliveryInstructions && (
                <p className="rounded-xl bg-surface-muted p-3 text-xs text-muted">“{order.deliveryInstructions}”</p>
              )}
              {order.deliveryProblem && (
                <p className="rounded-xl bg-danger-soft p-3 text-xs text-danger">{order.deliveryProblem}</p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Payment" />
            <div className="space-y-2 px-5 py-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Method</span>
                <span className="font-medium">{order.paymentLabel ?? "Not recorded"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Settlement</span>
                <Badge tone={order.isSettled ? "success" : "neutral"}>{order.isSettled ? "Settled" : "Awaiting"}</Badge>
              </div>
              {order.paidAt && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Paid</span>
                  <time dateTime={order.paidAt}>{formatDate(order.paidAt)}</time>
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Actions" />
            <div className="space-y-2 px-5 py-4">
              {nextLabel ? (
                <Button type="button" size="lg" className="w-full" onClick={onAdvance} disabled={busy}>
                  {advance.isPending ? "Updating…" : nextLabel}
                </Button>
              ) : (
                <p className="text-sm text-muted">
                  {order.status === "out_for_delivery"
                    ? "The customer confirms delivery in their own app — a vendor can't mark this delivered."
                    : "No further action needed on this order."}
                </p>
              )}

              {isVendorOrderOpen(order.status) && (
                <>
                  <label className="press flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-medium hover:border-foreground">
                    <Camera className="size-4" aria-hidden />
                    {order.dispatchPhotoUrl ? "Replace dispatch photo" : "Add dispatch photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={busy}
                      onChange={(e) => {
                        const photo = e.target.files?.[0];
                        e.target.value = "";
                        if (!photo) return;
                        dispatchPhoto.mutate(
                          { orderId: order.id, photo },
                          {
                            onSuccess: () => toast.success("Dispatch photo added"),
                            onError: (err) => toast.error(err instanceof Error ? err.message : "We couldn't upload that photo."),
                          },
                        );
                      }}
                    />
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    disabled={busy}
                    onClick={() =>
                      notifyDeparture.mutate(order.id, {
                        onSuccess: () => toast.success("The customer has been told you're on the way"),
                        onError: (err) => toast.error(err instanceof Error ? err.message : "We couldn't send that notification."),
                      })
                    }
                  >
                    <BellRing className="size-4" aria-hidden />
                    {order.departureNotifiedAt ? "Notify again" : "Notify departure"}
                  </Button>

                  <Button type="button" variant="outline" size="lg" className="w-full" disabled={busy} onClick={() => setCourierPrompt(true)}>
                    <Truck className="size-4" aria-hidden />
                    Request an ODOS rider
                  </Button>
                </>
              )}

              {canCancelVendorOrder(order.status) && (
                <Button type="button" variant="ghost" size="lg" className="w-full text-danger" disabled={busy} onClick={() => setCancelling(true)}>
                  Cancel order
                </Button>
              )}
            </div>
          </Panel>

          {order.dispatchPhotoUrl && (
            <Panel>
              <PanelHeader title="Dispatch photo" />
              <div className="p-5">
                {/* eslint-disable-next-line @next/next/no-img-element -- Remote upload, not in the image allowlist. */}
                <img src={order.dispatchPhotoUrl} alt="Dispatch proof" className="w-full rounded-xl border border-line" />
              </div>
            </Panel>
          )}
        </div>
      </div>

      <VendorCancelOrderDialog
        order={cancelling ? order : null}
        open={cancelling}
        onClose={() => setCancelling(false)}
      />

      <ConfirmDialog
        open={courierPrompt}
        onCancel={() => setCourierPrompt(false)}
        title="Hand this delivery to an ODOS rider?"
        description="ODOS assigns one of its own riders to collect and deliver this order. Orders you don't ask about stay with your own rider."
        confirmLabel="Request rider"
        pending={requestCourier.isPending}
        onConfirm={() =>
          requestCourier.mutate(order.id, {
            onSuccess: () => toast.success("An ODOS rider has been requested"),
            onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't request a rider."),
            onSettled: () => setCourierPrompt(false),
          })
        }
      />
    </div>
  );
}
