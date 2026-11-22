"use client";

import { AlertTriangle, BanknoteArrowDown, CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/libs/cn";
import { formatDateTime, formatMoney } from "@/libs/format";
import { cancellationReasonLabel, orderStateCopy, type OrderTone } from "@/libs/order-state";
import type { Order, OrderRefund } from "@/types/order";

const TONE_BADGE: Record<OrderTone, BadgeTone> = {
  pending: "neutral",
  active: "accent",
  good: "success",
  warning: "warning",
  dead: "neutral",
};

const TONE_PANEL: Record<OrderTone, string> = {
  pending: "border-line bg-surface-muted",
  active: "border-accent/30 bg-accent-soft/40",
  good: "border-success/30 bg-success-soft/40",
  warning: "border-warning/40 bg-warning-soft/30",
  dead: "border-line bg-surface-muted",
};

const TONE_ICON: Record<OrderTone, typeof Info> = {
  pending: Clock,
  active: Info,
  good: CheckCircle2,
  warning: AlertTriangle,
  dead: XCircle,
};

/** A refund status in words, never the raw enum. */
const REFUND_LABEL: Record<string, string> = {
  pending: "Being prepared",
  approved: "Approved",
  processing: "Being sent",
  successful: "Paid back",
  failed: "Didn't go through",
};

const REFUND_TONE: Record<string, BadgeTone> = {
  pending: "neutral",
  approved: "accent",
  processing: "warning",
  successful: "success",
  failed: "danger",
};

/**
 * One honest sentence about where this order stands, plus the money trail if
 * any exists.
 *
 * The four state fields are rendered as what they mean rather than as what they
 * are called, and a refund is only ever described as paid once the API says a
 * provider actually confirmed it — `confirmedAt` with a `providerReference`.
 * Until then it reads as in progress, because that is all anyone knows.
 */
export function OrderStateNotice({ order }: { order: Order }) {
  const copy = orderStateCopy(order);
  const Icon = TONE_ICON[copy.tone];
  const reason = cancellationReasonLabel(order.cancellationReasonCode);

  return (
    <section
      className={cn("rounded-2xl border p-5 sm:p-6", TONE_PANEL[copy.tone])}
      aria-labelledby="order-state-heading"
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="order-state-heading" className="font-semibold tracking-normal">
              {copy.label}
            </h2>
            <Badge tone={TONE_BADGE[copy.tone]}>{order.paymentLabel}</Badge>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-muted">{copy.detail}</p>

          {order.cancellationRequestedAt && (
            <dl className="mt-3 space-y-1 text-sm text-muted">
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-foreground">Requested</dt>
                <dd>{formatDateTime(order.cancellationRequestedAt)}</dd>
              </div>
              {reason && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-foreground">Reason</dt>
                  <dd>{reason}</dd>
                </div>
              )}
              {order.cancellationDecisionNote && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-foreground">Note</dt>
                  <dd>{order.cancellationDecisionNote}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      {order.refunds.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-line/70 pt-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BanknoteArrowDown className="size-4 text-muted" aria-hidden />
            {order.refunds.length === 1 ? "Your refund" : "Your refunds"}
          </h3>
          {order.refunds.map((refund) => (
            <RefundRow key={refund.id} refund={refund} />
          ))}
        </div>
      )}
    </section>
  );
}

function RefundRow({ refund }: { refund: OrderRefund }) {
  const status = (refund.status || "").toLowerCase();
  // "Paid back" is only true once a provider reference exists to prove it.
  const settled = status === "successful" && Boolean(refund.confirmedAt);
  const label = settled ? "Paid back" : (REFUND_LABEL[status] ?? "In progress");

  return (
    <div className="rounded-xl border border-line bg-surface p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{formatMoney(refund.amount)}</span>
        <Badge tone={settled ? "success" : (REFUND_TONE[status] ?? "neutral")}>{label}</Badge>
      </div>

      <dl className="mt-2.5 space-y-1 text-muted">
        <div className="flex flex-wrap gap-x-2">
          <dt>Reference</dt>
          <dd className="font-mono text-xs">{refund.reference}</dd>
        </div>
        {refund.deliveryAmount > 0 && (
          <div className="flex flex-wrap gap-x-2">
            <dt>Includes delivery</dt>
            <dd>{formatMoney(refund.deliveryAmount)}</dd>
          </div>
        )}
        {refund.discountWithheld > 0 && (
          <div className="flex flex-wrap gap-x-2">
            <dt>Discount not refunded</dt>
            <dd>{formatMoney(refund.discountWithheld)}</dd>
          </div>
        )}
        {settled && refund.confirmedAt && (
          <div className="flex flex-wrap gap-x-2">
            <dt>Sent</dt>
            <dd>{formatDateTime(refund.confirmedAt)}</dd>
          </div>
        )}
      </dl>

      {status === "failed" && refund.failureReason && (
        <p className="mt-2.5 text-danger">{refund.failureReason}</p>
      )}
    </div>
  );
}
