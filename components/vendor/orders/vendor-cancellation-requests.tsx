"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { useDecideVendorCancellation } from "@/hooks/use-vendor";
import { cn } from "@/libs/cn";
import { formatDateTime, formatMoney } from "@/libs/format";
import { cancellationReasonLabel } from "@/libs/order-state";
import type { VendorOrder } from "@/types/vendor";

/** Orders where the shopper is waiting on this vendor to answer. */
export const pendingCancellations = (orders: VendorOrder[]) =>
  orders.filter((order) => order.cancellationStatus === "requested");

/**
 * Cancellations the shopper asked for after this vendor had already accepted.
 *
 * Deliberately above the queues rather than behind a tab: someone is waiting on
 * an answer, and until it comes the vendor may still be packing an order that is
 * about to be stopped. Approving refunds the shopper; declining keeps the order
 * alive, so the note is the vendor's chance to explain and is required for a
 * decline.
 */
export function VendorCancellationRequests({ orders }: { orders: VendorOrder[] }) {
  const requests = pendingCancellations(orders);
  if (requests.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-warning/40 bg-warning-soft/30 p-5"
      aria-labelledby="cancellation-requests-heading"
    >
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="cancellation-requests-heading" className="font-semibold tracking-normal">
            {requests.length === 1
              ? "A customer wants to cancel an order"
              : `${requests.length} customers want to cancel their orders`}
          </h2>
          <p className="mt-1 text-sm text-muted">
            You&apos;ve already accepted {requests.length === 1 ? "this one" : "these"}, so it&apos;s
            your call. Hold off on packing until you decide.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {requests.map((order) => (
          <li key={order.id}>
            <RequestRow order={order} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RequestRow({ order }: { order: VendorOrder }) {
  const decide = useDecideVendorCancellation();
  const [mode, setMode] = useState<"approve" | "decline" | null>(null);
  const [note, setNote] = useState("");

  const reason = cancellationReasonLabel(order.cancellationReasonCode);
  // A decline leaves the order live, so the customer is owed an explanation.
  const noteRequired = mode === "decline";
  const canSubmit = !decide.isPending && (!noteRequired || note.trim().length > 0);

  const submit = () => {
    if (!mode || !canSubmit) return;
    const approve = mode === "approve";
    decide.mutate(
      { orderId: order.id, approve, note: note.trim() || null },
      {
        onSuccess: () => {
          setMode(null);
          setNote("");
          toast.success(
            approve
              ? `Order ${order.number} cancelled. We'll refund the customer.`
              : `You've kept order ${order.number}. The customer has been told why.`,
          );
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "We couldn't save that decision."),
      },
    );
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="font-semibold">Order {order.number}</p>
          <p className="mt-0.5 text-sm text-muted">
            {order.buyerName}
            {order.cancellationRequestedAt && (
              <>
                {" · asked "}
                <time dateTime={order.cancellationRequestedAt}>
                  {formatDateTime(order.cancellationRequestedAt)}
                </time>
              </>
            )}
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums">{formatMoney(order.total)}</p>
      </div>

      {reason && (
        <p className="mt-2 text-sm">
          <span className="text-muted">Reason: </span>
          {reason}
        </p>
      )}
      {order.cancellationReason && (
        <p className="mt-1 text-sm text-muted">&ldquo;{order.cancellationReason}&rdquo;</p>
      )}

      {mode === null ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setMode("approve")}>
            Allow the cancellation
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setMode("decline")}>
            Decline it
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          <p className="text-sm">
            {mode === "approve"
              ? `This stops order ${order.number} and starts a refund for ${formatMoney(order.total)}.`
              : "The order stays live. Tell the customer why — they'll see this."}
          </p>
          <textarea
            className={cn(inputClass, "h-20 resize-y py-3")}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              mode === "approve"
                ? "Anything to add? (optional)"
                : "Why can't this be cancelled? (required)"
            }
            aria-label={mode === "approve" ? "Note for the customer" : "Why you're declining"}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={submit} disabled={!canSubmit}>
              {decide.isPending
                ? "Saving…"
                : mode === "approve"
                  ? "Confirm cancellation"
                  : "Decline and keep the order"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setMode(null);
                setNote("");
              }}
              disabled={decide.isPending}
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
