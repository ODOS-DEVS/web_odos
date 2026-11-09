"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, PackageCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import {
  useConfirmDelivery,
  useRateDelivery,
  useReportDeliveryProblem,
  useRescheduleDelivery,
} from "@/hooks/use-orders";
import { cn } from "@/libs/cn";
import { DELIVERY_PROBLEM_REASONS, type DeliveryProblemReason } from "@/services/orders.service";
import type { Order } from "@/types/order";

const errorText = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** Report a problem, scoped to one vendor's package when the order has several. */
function ProblemForm({ order, onClose }: { order: Order; onClose: () => void }) {
  const report = useReportDeliveryProblem(order.id);
  const [reason, setReason] = useState<DeliveryProblemReason>(DELIVERY_PROBLEM_REASONS[0].value);
  const [details, setDetails] = useState("");
  const [packageId, setPackageId] = useState<string>("");

  const onSubmit = () =>
    report.mutate(
      { reason, details, packageId: packageId || undefined },
      {
        onSuccess: () => {
          toast.success("Thanks — we've flagged this with the vendor");
          onClose();
        },
        onError: (error) => toast.error(errorText(error, "We couldn't report that problem.")),
      },
    );

  return (
    <div className="mt-4 rounded-xl border border-line bg-surface-muted/50 p-4">
      <p className="text-sm font-medium">What went wrong?</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {DELIVERY_PROBLEM_REASONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setReason(option.value)}
            className={cn(
              "press rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              reason === option.value ? "border-foreground bg-foreground text-background" : "border-line hover:border-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {order.packages.length > 1 && (
        <div className="mt-3">
          <label htmlFor="problem-package" className="mb-1.5 block text-xs font-medium">
            Which package?
          </label>
          <select
            id="problem-package"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className={inputClass}
          >
            {/* Scoping it also scopes the settlement hold, so only the named vendor is affected. */}
            <option value="">All packages</option>
            {order.packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.storeName}
              </option>
            ))}
          </select>
        </div>
      )}

      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value.slice(0, 500))}
        rows={3}
        maxLength={500}
        placeholder="Anything else we should know? (optional)"
        className={cn(inputClass, "mt-3 h-auto resize-y py-2.5")}
      />

      <div className="mt-3 flex gap-2.5">
        <Button type="button" size="sm" variant="accent" onClick={onSubmit} disabled={report.isPending}>
          {report.isPending ? "Reporting…" : "Report problem"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function RescheduleForm({ order, onClose }: { order: Order; onClose: () => void }) {
  const reschedule = useRescheduleDelivery(order.id);
  const [note, setNote] = useState("");

  const onSubmit = () =>
    reschedule.mutate(
      { note },
      {
        onSuccess: () => {
          toast.success("We've asked for another delivery attempt");
          onClose();
        },
        onError: (error) => toast.error(errorText(error, "We couldn't request a reschedule.")),
      },
    );

  return (
    <div className="mt-4 rounded-xl border border-line bg-surface-muted/50 p-4">
      <label htmlFor="reschedule-note" className="text-sm font-medium">
        When would suit you better?
      </label>
      <textarea
        id="reschedule-note"
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 280))}
        rows={2}
        maxLength={280}
        placeholder="e.g. Tomorrow morning, or after 5pm"
        className={cn(inputClass, "mt-2 h-auto resize-y py-2.5")}
      />
      <div className="mt-3 flex gap-2.5">
        <Button type="button" size="sm" variant="accent" onClick={onSubmit} disabled={reschedule.isPending}>
          {reschedule.isPending ? "Requesting…" : "Request reschedule"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function DeliveryRating({ order }: { order: Order }) {
  const rate = useRateDelivery(order.id);
  const [hovered, setHovered] = useState(0);
  const current = order.deliveryRating ?? 0;

  if (order.deliveryRating) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted">
        You rated this delivery
        <span className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn("size-4", i < current ? "fill-warning text-warning" : "text-line")}
              aria-hidden
            />
          ))}
        </span>
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium">How was the delivery?</p>
      <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {Array.from({ length: 5 }, (_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} out of 5`}
              disabled={rate.isPending}
              onMouseEnter={() => setHovered(value)}
              onClick={() =>
                rate.mutate(value, {
                  onSuccess: () => toast.success("Thanks for the feedback"),
                  onError: (error) => toast.error(errorText(error, "We couldn't save your rating.")),
                })
              }
              className="press rounded-full p-0.5 disabled:opacity-60"
            >
              <Star className={cn("size-6", value <= hovered ? "fill-warning text-warning" : "text-line")} aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * What the shopper can do about this delivery right now.
 *
 * Confirming receipt is only offered once a vendor has actually dispatched — before that there is
 * nothing to confirm — and rating only once something has been delivered.
 */
export function DeliveryActions({ order }: { order: Order }) {
  const confirm = useConfirmDelivery(order.id);
  const [panel, setPanel] = useState<"problem" | "reschedule" | null>(null);

  const anyDispatched = order.packages.some((p) => p.dispatchedAt && !p.deliveredAt);
  const anyDelivered = order.status === "delivered" || order.packages.some((p) => p.deliveredAt);
  const inFlight = order.status === "out_for_delivery" || order.status === "delayed" || anyDispatched;

  if (!inFlight && !anyDelivered) return null;

  return (
    <section aria-labelledby="delivery-actions" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 id="delivery-actions" className="font-semibold tracking-normal">
        Delivery
      </h2>

      {order.rescheduleRequestedAt && (
        <p className="mt-3 flex gap-2 rounded-xl bg-surface-muted p-3 text-sm text-muted" role="status">
          <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Reschedule requested{order.rescheduleNote ? ` — “${order.rescheduleNote}”` : ""}. The vendor will be in touch.
          </span>
        </p>
      )}

      {order.deliveryProblem && (
        <p className="mt-3 flex gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger" role="status">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Problem reported: {order.deliveryProblem.replace(/_/g, " ")}. We’re on it.</span>
        </p>
      )}

      {inFlight && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button
            type="button"
            size="sm"
            variant="accent"
            disabled={confirm.isPending}
            onClick={() =>
              confirm.mutate(undefined, {
                onSuccess: () => toast.success("Thanks — marked as delivered"),
                onError: (error) => toast.error(errorText(error, "We couldn't confirm that.")),
              })
            }
          >
            <PackageCheck className="size-4" aria-hidden />
            {confirm.isPending ? "Confirming…" : "I’ve received everything"}
          </Button>

          <Button type="button" size="sm" variant="outline" onClick={() => setPanel(panel === "problem" ? null : "problem")}>
            Report a problem
          </Button>

          {!order.rescheduleRequestedAt && (
            <Button type="button" size="sm" variant="outline" onClick={() => setPanel(panel === "reschedule" ? null : "reschedule")}>
              Reschedule
            </Button>
          )}
        </div>
      )}

      {panel === "problem" && <ProblemForm order={order} onClose={() => setPanel(null)} />}
      {panel === "reschedule" && <RescheduleForm order={order} onClose={() => setPanel(null)} />}

      {anyDelivered && (
        <div className={cn(inFlight && "mt-5 border-t border-line pt-5")}>
          <DeliveryRating order={order} />
        </div>
      )}
    </section>
  );
}
