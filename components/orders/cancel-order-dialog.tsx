"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { useScrollLockedEscape } from "@/hooks/use-scroll-locked-escape";
import { useCancelOrder } from "@/hooks/use-orders";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import { SHOPPER_CANCEL_REASONS } from "@/libs/order-state";
import { ApiError } from "@/services/http";
import type { Order } from "@/types/order";

/**
 * Cancelling an order, said honestly.
 *
 * What the shopper is told depends on what is actually true of their order: a
 * paid order promises a refund and names the amount, an unpaid one says nothing
 * was charged, and an order the seller has already accepted says the seller has
 * to agree first. The message afterwards reports what the server actually did
 * rather than assuming the order went away -- `cancellationStatus` comes back
 * "requested" whenever the decision isn't ours to make.
 */
export function CancelOrderDialog({
  order,
  open,
  onClose,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
}) {
  const cancel = useCancelOrder();
  const [reasonCode, setReasonCode] = useState<string>(SHOPPER_CANCEL_REASONS[0].value);
  const [note, setNote] = useState("");

  useScrollLockedEscape(open, onClose);

  const isPaid = order.paymentStatus === "paid";
  // Anything past "pending" means the seller has committed work, so the server
  // holds the request for them instead of cancelling on the spot.
  const sellerAccepted = order.packages.some((p) => p.status !== "pending" && p.status !== "cancelled");

  const submit = () => {
    cancel.mutate(
      { id: order.id, reasonCode, note: note.trim() || null },
      {
        onSuccess: (updated) => {
          onClose();
          if (updated.cancellationStatus === "requested") {
            toast.success("Cancellation requested — we've asked the seller to confirm.");
          } else if (updated.refundStatus !== "not_applicable") {
            toast.success("Order cancelled. Your refund has been started.");
          } else {
            toast.success("Order cancelled.");
          }
        },
        onError: (error) => {
          onClose();
          toast.error(error instanceof ApiError ? error.message : "We couldn't cancel this order.");
        },
      },
    );
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-heading"
        className="rise-in relative w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl"
      >
        <h2 id="cancel-order-heading" className="text-lg font-semibold">
          {sellerAccepted ? `Ask to cancel order ${order.number}?` : `Cancel order ${order.number}?`}
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted">
          {sellerAccepted
            ? "The seller has already started preparing this order, so they need to approve the cancellation. We'll let you know as soon as they respond."
            : isPaid
              ? `You paid ${formatMoney(order.total)} for this order. Cancelling starts a refund — we'll confirm here once the money has been sent back.`
              : "You haven't been charged for this order, so there is nothing to refund. The items go back on sale."}
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Why are you cancelling?</span>
            <select
              className={inputClass}
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value)}
            >
              {SHOPPER_CANCEL_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Anything else? <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea
              className={cn(inputClass, "h-20 resize-y py-3")}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="A little more detail helps the seller."
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button type="button" size="lg" className="w-full" onClick={submit} disabled={cancel.isPending}>
            {cancel.isPending
              ? "Please wait…"
              : sellerAccepted
                ? "Request cancellation"
                : "Cancel this order"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onClose}
            disabled={cancel.isPending}
          >
            Keep my order
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
