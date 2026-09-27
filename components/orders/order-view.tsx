"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, Info, MapPin } from "lucide-react";
import { toast } from "sonner";
import { RequireLogin } from "@/components/auth/require-login";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { QueryError } from "@/components/ui/query-error";
import { formatDate, formatDateTime } from "@/libs/format";
import { STATUS_LABEL } from "@/libs/orders";
import { mockStoreMap } from "@/mocks/catalog.mock";
import { useFakeMutation } from "@/mocks/mutation";
import { mockOrder } from "@/mocks/orders.mock";
import { fakeQuery } from "@/mocks/query";
import { ApiError } from "@/services/http";
import type { Order } from "@/types/order";
import { PackageCard } from "./package-card";
import { StatusBadge } from "./status-badge";

function OrderDetail({ id }: { id: string }) {
  const found = mockOrder(id);
  const order = found
    ? fakeQuery(found)
    : fakeQuery(undefined as Order | undefined, { isError: true, error: new ApiError(404, "Order not found") });
  const cancel = useFakeMutation((_orderId: string) => ({ ...found!, status: "cancelled" as const }));
  const stores = mockStoreMap();

  if (order.isPending) return <div className="mt-8 h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  if (order.isError) {
    const missing = order.error instanceof ApiError && order.error.status === 404;
    return <div className="mt-8"><QueryError error={order.error} onRetry={() => order.refetch()} title={missing ? "We couldn’t find that order" : "We couldn’t load this order"} /></div>;
  }

  const o = order.data;
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
          <StatusBadge status={o.status} className="px-3.5 py-2 text-sm" />
        </div>
      </header>

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
          {o.packages.map((pkg, index) => (
            <PackageCard key={pkg.id} pkg={pkg} store={pkg.storeId ? stores.get(pkg.storeId) : undefined} index={index} />
          ))}
        </div>

        <div className="space-y-5 lg:tall:sticky lg:tall:top-40">
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
              {o.paymentLabel} · <span className="capitalize">{o.paymentStatus.replace(/[_-]+/g, " ")}</span>
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
