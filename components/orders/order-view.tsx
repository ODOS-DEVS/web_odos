"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Info, MapPin, ReceiptText } from "lucide-react";
import { RequireLogin } from "@/components/auth/require-login";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { QueryError } from "@/components/ui/query-error";
import { formatDate, formatDateTime } from "@/libs/format";
import { STATUS_LABEL } from "@/libs/orders";
import { useStoreMap } from "@/hooks/use-catalog";
import { useOrder } from "@/hooks/use-orders";
import { ApiError } from "@/services/http";
import { cancellability, paymentStateLabel } from "@/libs/order-state";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { DeliveryActions } from "./delivery-actions";
import { OrderStateBadge } from "./order-state-badge";
import { OrderStateNotice } from "./order-state-notice";
import { PackageCard } from "./package-card";

function OrderDetail({ id }: { id: string }) {
  const order = useOrder(id);
  const [confirming, setConfirming] = useState(false);
  const { map: stores } = useStoreMap();

  if (order.isPending) return <div className="mt-8 h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  if (order.isError) {
    const missing = order.error instanceof ApiError && order.error.status === 404;
    return <div className="mt-8"><QueryError error={order.error} onRetry={() => order.refetch()} title={missing ? "We couldn’t find that order" : "We couldn’t load this order"} /></div>;
  }

  if (!order.data) return <div className="mt-8 h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;

  const o = order.data;
  const mixed = new Set(o.packages.map((p) => p.status)).size > 1;
  const laggard = o.packages.filter((p) => p.status === o.status).length;
  // Mirrors the API's own cancellation rule (libs/order-state), so the button
  // never appears on an order the server will refuse -- and its label says
  // whether cancelling ends the order or only files a request.
  const ability = cancellability(o);

  return (
    <>
      <header className="mt-2 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Order {o.number}</h1>
          <p className="mt-2 text-muted">
            Placed <time dateTime={o.placedAt}>{formatDate(o.placedAt)}</time> · {o.packages.length} {o.packages.length === 1 ? "package" : "packages"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={`/orders/${o.id}/receipt`} variant="outline" size="sm">
            <ReceiptText className="size-4" aria-hidden />
            Receipt
          </ButtonLink>
          {ability.can && (
            <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
              {ability.requiresReview ? "Request cancellation" : "Cancel order"}
            </Button>
          )}
          <OrderStateBadge order={o} className="px-3.5 py-2 text-sm" />
        </div>
      </header>

      <CancelOrderDialog order={o} open={confirming} onClose={() => setConfirming(false)} />

      {!ability.can && ability.reason && (
        <p className="mb-8 flex gap-3 rounded-2xl bg-surface-muted p-4 text-sm" role="note">
          <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <span>{ability.reason}</span>
        </p>
      )}

      {mixed && (
        <p className="mb-8 flex gap-3 rounded-2xl bg-surface-muted p-4 text-sm" role="note">
          <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <span>
            <strong className="font-semibold">Each vendor delivers separately.</strong> Your order status follows its least advanced package: {laggard} of{" "}
            {o.packages.length} {laggard === 1 ? "is" : "are"} {STATUS_LABEL[o.status].toLowerCase()}.
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <OrderStateNotice order={o} />

          {o.packages.map((pkg, index) => (
            <PackageCard key={pkg.id} pkg={pkg} store={pkg.storeId ? stores.get(pkg.storeId) : undefined} index={index} orderId={o.id} />
          ))}
        </div>

        <div className="space-y-5 lg:tall:sticky lg:tall:top-40">
          <DeliveryActions order={o} />

          <OrderSummary totals={{ items: o.subtotal, delivery: o.shipping, total: o.subtotal + o.shipping, vendors: o.packages.length }} discount={o.discount} />

          <section className="rounded-2xl border border-line bg-surface p-5 text-sm sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold tracking-normal">
              <MapPin className="size-4 text-muted" aria-hidden />
              Delivery address
            </h2>
            <address className="mt-3 leading-6 text-muted not-italic">
              {o.address.name}
              <br />
              {o.address.street}
              <br />
              {o.address.city}, {o.address.region}
              <br />
              {o.address.phone}
            </address>
            <h2 className="mt-6 flex items-center gap-2 font-semibold tracking-normal">
              <CreditCard className="size-4 text-muted" aria-hidden />
              Payment
            </h2>
            <p className="mt-3 text-muted">
              {o.paymentLabel} · {paymentStateLabel(o)}
            </p>
          </section>

          {o.timeline.length > 0 && (
            <section className="rounded-2xl border border-line bg-surface p-5 text-sm sm:p-6" aria-labelledby="timeline-heading">
              <h2 id="timeline-heading" className="font-semibold tracking-normal">
                Order history
              </h2>
              <ol className="mt-4 space-y-4 border-l border-line pl-4">
                {[...o.timeline].reverse().map((event, i) => (
                  <li key={`${event.at}-${i}`} className="relative">
                    <span className="absolute top-1.5 -left-[1.3125rem] size-2 rounded-full bg-foreground" aria-hidden />
                    <p>{event.label}</p>
                    <time dateTime={event.at} className="text-xs text-muted">
                      {formatDateTime(event.at)}
                    </time>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

export function OrderView({ id }: { id: string }) {
  return (
    <Container className="py-8 sm:py-12">
      <Link href="/orders" className="press mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All orders
      </Link>
      <RequireLogin next={`/orders/${id}`} message="Log in to see this order and track its delivery.">
        <OrderDetail id={id} />
      </RequireLogin>
    </Container>
  );
}
