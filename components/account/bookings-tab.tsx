"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Loader2, MapPin, ShieldCheck, Wrench } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { formatDateTime, formatMoney } from "@/libs/format";
import { BOOKING_STATUS_LABELS } from "@/libs/service-bookings";
import { useBookingHold, useConfirmWork, useMyBookings, useTransitionBooking } from "@/hooks/use-services";
import type { Booking } from "@/types/services";

const TONE: Record<string, BadgeTone> = {
  pending_provider: "warning",
  pending_payment: "warning",
  confirmed: "accent",
  in_progress: "accent",
  completed: "success",
  cancelled: "neutral",
  declined: "neutral",
  expired: "neutral",
  disputed: "danger",
};

/** "in 31 hours", so the grace window reads as a deadline rather than a timestamp. */
function untilLabel(iso: string) {
  const ms = Date.parse(iso) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "any moment now";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return `in ${Math.max(1, Math.floor(ms / 60_000))} minutes`;
  if (hours < 48) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  return `in ${Math.floor(hours / 24)} days`;
}

/**
 * The escrow panel — the part of a booking the customer most needs to understand.
 *
 * Only fetched once the booking is far enough along to be holding money, so browsing a list of
 * old bookings does not fire a hold request per row.
 */
function EscrowPanel({ booking }: { booking: Booking }) {
  const relevant = ["confirmed", "in_progress", "completed", "disputed"].includes(booking.status);
  const { data: hold, isPending } = useBookingHold(booking.id, relevant);
  const confirm = useConfirmWork();
  const dispute = useTransitionBooking();
  const [confirming, setConfirming] = useState(false);
  const [disputing, setDisputing] = useState(false);

  if (!relevant) return null;
  if (isPending) {
    return (
      <p className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Checking what&apos;s held…
      </p>
    );
  }
  if (!hold) return null;

  if (hold.releasedAt) {
    return (
      <p className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-success">
        <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
        Paid to the provider on {formatDateTime(hold.releasedAt)}.
      </p>
    );
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="flex items-start gap-2 text-xs leading-5 text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        <span>
          ODOS is holding <strong className="text-foreground">{formatMoney(hold.amountHeld)}</strong>.
          {hold.awaitingConfirmation ? (
            <>
              {" "}
              The provider says the work is done. Confirm to release it, or it releases automatically{" "}
              {hold.autoReleaseAt ? untilLabel(hold.autoReleaseAt) : "after the grace window"}.
            </>
          ) : (
            " It is released once the work is done and you confirm."
          )}
        </span>
      </p>

      {hold.awaitingConfirmation && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setConfirming(true)} disabled={confirm.isPending}>
            <CheckCircle2 className="size-4" aria-hidden />
            Confirm and release
          </Button>
          <Button type="button" size="sm" variant="ghost" className="text-danger" onClick={() => setDisputing(true)}>
            <AlertTriangle className="size-4" aria-hidden />
            Something&apos;s wrong
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        title={`Release ${formatMoney(hold.amountHeld)} to the provider?`}
        description="Only do this once the work is genuinely finished. The payment leaves ODOS and goes to the provider, and this cannot be undone."
        confirmLabel="Confirm and release"
        cancelLabel="Not yet"
        pending={confirm.isPending}
        onConfirm={() =>
          confirm.mutate(booking.id, {
            onSuccess: () => {
              toast.success("Payment released. Thanks for confirming.");
              setConfirming(false);
            },
            onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't release that payment."),
          })
        }
      />

      <ConfirmDialog
        open={disputing}
        onCancel={() => setDisputing(false)}
        title="Raise a problem with this booking?"
        description="The payment stays with ODOS and our team reviews it with you and the provider. Use this if the work wasn't done, or wasn't done properly."
        confirmLabel="Raise a problem"
        cancelLabel="Cancel"
        pending={dispute.isPending}
        onConfirm={() =>
          dispute.mutate(
            { id: booking.id, status: "disputed" },
            {
              onSuccess: () => {
                toast.success("Raised. ODOS will be in touch.");
                setDisputing(false);
              },
              onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't raise that."),
            },
          )
        }
      />
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const unpaid = booking.status === "pending_payment" || booking.amountPaid <= 0;

  return (
    <li className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Booking {booking.bookingNumber}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            {booking.scheduledStartAt ? formatDateTime(booking.scheduledStartAt) : "Time to be confirmed"}
          </p>
          {(booking.locationAddress || booking.locationCity) && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {[booking.locationAddress, booking.locationCity].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={TONE[booking.status] ?? "neutral"}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
          <span className="text-sm font-semibold tabular-nums">{formatMoney(booking.totalAmount)}</span>
        </div>
      </div>

      {unpaid && booking.status !== "cancelled" && booking.status !== "declined" && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-warning-soft p-3 text-xs text-warning">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          Payment not completed yet
          {booking.paymentDeadlineAt ? ` — due ${untilLabel(booking.paymentDeadlineAt)}` : ""}.
        </p>
      )}

      <EscrowPanel booking={booking} />

      <div className="mt-3 flex flex-wrap gap-2">
        <ButtonLink href={`/services/${booking.serviceId}`} variant="ghost" size="sm">
          View the service
        </ButtonLink>
      </div>
    </li>
  );
}

/** The shopper's service bookings, with the escrow state front and centre. */
export function BookingsTab() {
  const { data, isPending, isError, error, refetch } = useMyBookings();

  if (isError) {
    return (
      <QueryError
        title="We couldn't load your bookings"
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        icon={<Wrench className="size-10 text-muted" aria-hidden />}
        iconBadge
        title="No service bookings yet"
        description="When you book a professional on ODOS, it shows up here with its payment status."
        action={
          <ButtonLink href="/services" size="lg">
            Browse services
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {data.length} booking{data.length === 1 ? "" : "s"}. ODOS holds each payment until the work is confirmed —{" "}
        <Link href="/help" className="press font-medium text-accent">
          how this works
        </Link>
        .
      </p>
      <ul className="space-y-4">
        {data.map((booking) => (
          <BookingRow key={booking.id} booking={booking} />
        ))}
      </ul>
    </div>
  );
}
