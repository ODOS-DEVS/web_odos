"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { useScrollLockedEscape } from "@/hooks/use-scroll-locked-escape";
import { useCancelVendorOrder } from "@/hooks/use-vendor";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import { VENDOR_CANCEL_REASONS, type VendorCancelReason, type VendorOrder } from "@/types/vendor";

/**
 * A vendor withdrawing their own package, with the reason the customer is told.
 *
 * The reason is required because it is what the shopper reads — "out of stock"
 * and "I can't fulfil this" mean very different things to someone waiting. On a
 * shared basket only this shop's items come out, which the copy says plainly so
 * a vendor doesn't think they are cancelling someone else's sale.
 */
export function VendorCancelOrderDialog({
  order,
  open,
  onClose,
}: {
  order: VendorOrder | null;
  open: boolean;
  onClose: () => void;
}) {
  const cancel = useCancelVendorOrder();
  const [reasonCode, setReasonCode] = useState<VendorCancelReason>("out_of_stock");
  const [note, setNote] = useState("");

  useScrollLockedEscape(open, onClose);

  if (!open || !order || typeof document === "undefined") return null;

  const shared = order.packageCount > 1;
  const paid = Boolean(order.paidAt);

  const submit = () =>
    cancel.mutate(
      { orderId: order.id, reasonCode, note: note.trim() || null },
      {
        onSuccess: () => {
          onClose();
          setNote("");
          toast.success(
            paid
              ? `Order ${order.number} withdrawn. We'll refund the customer.`
              : `Order ${order.number} withdrawn.`,
          );
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "We couldn't cancel that order."),
      },
    );

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
        aria-labelledby="vendor-cancel-heading"
        className="rise-in relative w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl"
      >
        <h2 id="vendor-cancel-heading" className="text-lg font-semibold">
          Cancel your items on order {order.number}?
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted">
          {shared
            ? `Only your ${order.productCount} item${order.productCount === 1 ? "" : "s"} come out of this order — the other shops on it are unaffected. `
            : ""}
          The stock goes back on your shelf
          {paid ? `, and we refund the customer ${formatMoney(order.total)}.` : "."}
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Why? <span className="font-normal text-muted">The customer sees this.</span>
            </span>
            <select
              className={inputClass}
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value as VendorCancelReason)}
            >
              {VENDOR_CANCEL_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Anything to add? <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea
              className={cn(inputClass, "h-20 resize-y py-3")}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. back in stock on Friday if they'd rather wait"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button type="button" size="lg" className="w-full" onClick={submit} disabled={cancel.isPending}>
            {cancel.isPending ? "Please wait…" : "Cancel my items"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onClose}
            disabled={cancel.isPending}
          >
            Keep the order
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
