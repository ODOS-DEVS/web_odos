"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Info, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { RequireLogin } from "@/components/auth/require-login";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { QueryError } from "@/components/ui/query-error";
import { cn } from "@/libs/cn";
import { formatDate, formatDateTime } from "@/libs/format";
import { STATUS_LABEL } from "@/libs/orders";
import { ApiError } from "@/services/http";
import { useStoreMap } from "@/hooks/use-catalog";
import { needsPayment, PayNow } from "@/components/orders/pay-now";
import { useCancelOrder, useOrder, useOrderActions } from "@/hooks/use-orders";
import type { Order } from "@/types/order";
import { PackageActions } from "./package-actions";
import { PackageCard } from "./package-card";
import { StatusBadge } from "./status-badge";

/** Mirrors the detail layout: title row, package cards, side column. */
function OrderSkeleton() {
  return (
    <div className="mt-2" aria-busy="true" aria-label="Loading order">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-36 animate-pulse rounded-2xl bg-surface-muted" />
          <div className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
          <div className="h-48 animate-pulse rounded-2xl bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}

/** 1–5 stars for the delivery (PATCH /orders/{id}/delivery-rating); shows the saved rating once given. */
function DeliveryRating({ order }: { order: Order }) {
  const { rate } = useOrderActions(order.id);
  const [hover, setHover] = useState(0);
  const value = hover || order.deliveryRating || 0;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <CheckCircle2 className="size-4 text-success" aria-hidden />
        {order.deliveryRating ? "Thanks for rating your delivery" : "How was your delivery?"}
      </h2>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Delivery rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={order.deliveryRating === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            disabled={rate.isPending}
            onMouseEnter={() => setHover(star)}
            onClick={() =>
              rate.mutate(star, {
                onSuccess: () => toast.success("Thanks for your rating"),
                onError: (error) => toast.error(error.message),
              })
            }
            className="press p-0.5 text-warning disabled:opacity-60"
          >
            <Star className={cn("size-7", star <= value ? "fill-current" : "text-line")} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}

function OrderDetail({ id }: { id: string }) {
  const query = useOrder(id);
  const cancel = useCancelOrder();
  const { map: stores } = useStoreMap();

  const o: Order | undefined = query.data;

  if (query.isPending) return <OrderSkeleton />;

  if (query.isError || !o) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mt-8">
        <QueryError
          error={query.error}
          onRetry={() => query.refetch()}
          title={missing ? "We couldn’t find that order" : "We couldn’t load this order"}
        />
      </div>
    );
  }

  if (!o) return null;

  const mixed = new Set(o.packages.map((p) => p.status)).size > 1;
  const laggard = o.packages.filter((p) => p.status === o.status).length;
  const cancellable = o.status === "pending" || o.status === "confirmed";

  return (
    <>
      <header className="mt-2 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Order {o.number}</h1>
          <p className="mt-2 text-muted">
            Placed <time dateTime={o.placedAt}>{formatDate(o.placedAt)}</time> · {o.packages.length} {o.packages.length === 1 ? "package" : "packages"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cancellable && (
            <Button
              variant="outline"
              size="sm"
              disabled={cancel.isPending}
              onClick={() =>
                cancel.mutate(o.id, {
                  onSuccess: () => toast.success("Order cancelled"),
                  onError: (e) => toast.error(e instanceof ApiError ? e.message : "We couldn’t cancel this order."),
                })
              }
            >
              {cancel.isPending ? "Cancelling…" : "Cancel order"}
            </Button>
          )}
          <StatusBadge status={o.status} />
        </div>
      </header>

      {mixed && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-sm sm:items-center">
          <Info className="size-5 shrink-0 text-muted" aria-hidden />
          <p className="text-muted">
            This order has items from multiple stores, so each store ships its own package. The overall status ({STATUS_LABEL[o.status].toLowerCase()}) reflects the {laggard === 1 ? "package that hasn’t caught up yet" : `${laggard} packages that haven’t caught up yet`}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {o.packages.map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              store={pkg.storeId ? stores.get(pkg.storeId) : undefined}
              index={index}
              actions={<PackageActions orderId={o.id} pkg={pkg} store={pkg.storeId ? stores.get(pkg.storeId) : undefined} />}
            />
          ))}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          {o.status === "delivered" && <DeliveryRating order={o} />}

          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-base font-semibold">Delivery address</h2>
            <div className="mt-3 flex items-start gap-2.5 text-sm text-muted">
              <MapPin className="size-4 shrink-0 text-foreground" aria-hidden />
              <div>
                <p className="font-medium text-foreground">{o.address.name}</p>
                <p>{o.address.street}</p>
                <p>{o.address.city}, {o.address.region}</p>
                <p className="mt-1">{o.address.phone}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-base font-semibold">Payment</h2>
            <div className="mt-3 flex items-center gap-2.5 text-sm">
              <CreditCard className="size-4 shrink-0 text-muted" aria-hidden />
              <span>{o.paymentLabel}</span>
            </div>
            <p className="mt-2 text-xs text-muted capitalize">Status: {o.paymentStatus}</p>
            {needsPayment(o.paymentStatus, o.status) && <PayNow orderId={o.id} />}
          </div>

          {o.timeline.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-base font-semibold">Order history</h2>
              <ol className="mt-4 space-y-4 border-l border-line pl-4">
                {[...o.timeline].reverse().map((event, i) => (
                  <li key={`${event.at}-${i}`} className="relative">
                    <span className={cn("absolute top-1.5 -left-[21px] size-2.5 rounded-full", i === 0 ? "bg-accent" : "bg-line")} aria-hidden />
                    <p className="text-sm font-medium">{event.label}</p>
                    <time dateTime={event.at} className="text-xs text-muted">
                      {formatDateTime(event.at)}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <OrderSummary
            totals={{
              items: o.subtotal,
              delivery: o.shipping,
              total: o.total + o.discount,
              vendors: o.packages.length,
            }}
            discount={o.discount}
          />
        </aside>
      </div>
    </>
  );
}

export function OrderView({ id }: { id: string }) {
  return (
    <Container className="max-w-5xl py-8 sm:py-12">
      <Link href="/orders" className="press -ml-2 mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Back to orders
      </Link>
      <RequireLogin next={`/orders/${encodeURIComponent(id)}`} message="Log in to view this order.">
        <OrderDetail id={id} />
      </RequireLogin>
    </Container>
  );
}
