"use client";

import Link from "next/link";
import { ArrowLeft, Printer, ReceiptText } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { formatDate, formatDateTime, formatMoney } from "@/libs/format";
import { STATUS_LABEL } from "@/libs/orders";
import { useOrder } from "@/hooks/use-orders";
import CONFIG from "@/utils/config";

/**
 * A printable record of one order.
 *
 * Every figure is read off the order the API already returns — nothing is recomputed here, so a
 * receipt can never disagree with the order page it came from. `print:` utilities strip the site
 * chrome so "Print" produces a clean page (and a PDF via the browser's own print dialog) without
 * a PDF dependency.
 */
export function ReceiptView({ id }: { id: string }) {
  const { data: order, isPending, isError, error, refetch } = useOrder(id);

  if (isPending) {
    return (
      <Container className="py-10">
        <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
      </Container>
    );
  }
  if (isError) {
    return (
      <Container className="py-10">
        <QueryError title="We couldn't load this receipt" error={error} onRetry={() => refetch()} />
      </Container>
    );
  }
  if (!order) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={<ReceiptText className="size-10 text-muted" aria-hidden />}
          title="Receipt not available"
          description="We couldn't find this order. Head back to your orders and try again."
          action={<ButtonLink href="/orders">Your orders</ButtonLink>}
        />
      </Container>
    );
  }

  const items = order.packages.flatMap((p) => p.items);

  return (
    <Container className="max-w-3xl py-8 print:max-w-none print:py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/orders/${order.id}`} className="press inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          Back to order
        </Link>
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden />
          Print or save as PDF
        </Button>
      </div>

      <article className="mt-5 rounded-2xl border border-line bg-surface p-6 sm:p-8 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="text-2xl font-bold tracking-tight">
              odos<span className="text-accent">.</span>
            </p>
            <p className="mt-1 text-sm text-muted">{CONFIG.SITE_NAME} receipt</p>
          </div>
          <dl className="text-sm sm:text-right">
            <div className="flex gap-2 sm:justify-end">
              <dt className="text-muted">Order</dt>
              <dd className="font-semibold">{order.number}</dd>
            </div>
            <div className="mt-1 flex gap-2 sm:justify-end">
              <dt className="text-muted">Placed</dt>
              <dd>
                <time dateTime={order.placedAt}>{formatDateTime(order.placedAt)}</time>
              </dd>
            </div>
            <div className="mt-1 flex gap-2 sm:justify-end">
              <dt className="text-muted">Status</dt>
              <dd>{STATUS_LABEL[order.status]}</dd>
            </div>
          </dl>
        </header>

        <section className="grid gap-6 border-b border-line py-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Delivered to</h2>
            <address className="mt-2 text-sm leading-6 not-italic">
              {order.address.name}
              <br />
              {order.address.street}
              <br />
              {order.address.city}, {order.address.region}
              <br />
              {order.address.phone}
            </address>
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Payment</h2>
            <p className="mt-2 text-sm leading-6">
              {order.paymentLabel}
              <br />
              <span className="text-muted">{order.paymentStatus.replace(/[_-]+/g, " ")}</span>
              <br />
              <span className="text-muted">{order.deliveryMethod.replace(/[_-]+/g, " ")}</span>
            </p>
          </div>
        </section>

        <section className="py-6">
          <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Items</h2>
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">Items on order {order.number}</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="pb-2 font-medium">Item</th>
                <th scope="col" className="pb-2 font-medium">Qty</th>
                <th scope="col" className="pb-2 text-right font-medium">Unit</th>
                <th scope="col" className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 pr-3">
                    {item.name}
                    {(item.size || item.color) && (
                      <span className="block text-xs text-muted">
                        {[item.color, item.size].filter(Boolean).join(" / ")}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(item.unitPrice)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border-t border-line pt-5">
          <dl className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between gap-6 text-success">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{formatMoney(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-6">
              <dt className="text-muted">Delivery</dt>
              <dd className="tabular-nums">{order.shipping > 0 ? formatMoney(order.shipping) : "Free"}</dd>
            </div>
            <div className="flex justify-between gap-6 border-t border-line pt-2 text-base font-semibold">
              <dt>Total paid</dt>
              <dd className="tabular-nums">{formatMoney(order.total)}</dd>
            </div>
          </dl>
        </section>

        {order.packages.length > 1 && (
          <section className="mt-6 border-t border-line pt-5">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Bags</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {order.packages.map((pkg) => (
                <li key={pkg.id}>
                  Bag {pkg.number} · {pkg.storeName} · {STATUS_LABEL[pkg.status]}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-8 border-t border-line pt-5 text-xs leading-6 text-muted">
          <p>
            Thank you for shopping on {CONFIG.SITE_NAME}. Each vendor packs and delivers their own
            part of your order.
          </p>
          <p className="mt-1">
            Questions about this order? Message the store from the order page, or contact
            info@odos.market. Receipt generated {formatDate(new Date().toISOString())}.
          </p>
        </footer>
      </article>
    </Container>
  );
}
