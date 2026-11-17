"use client";

import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CalendarClock, MapPin, MessageSquareQuote, Wrench } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { PageHeader, Panel, PanelHeader, SegmentedControl, SkeletonRows } from "@/components/vendor/vendor-ui";
import { formatDateTime, formatMoney } from "@/libs/format";
import {
  BOOKING_ACTION_LABELS,
  BOOKING_STATUS_LABELS,
  isBookingOpen,
  providerActions,
} from "@/libs/service-bookings";
import { useProviderBookings, useProviderQuotations, useSendQuote, useTransitionBooking } from "@/hooks/use-services";
import type { Booking, Quotation } from "@/types/services";

const STATUS_TONE: Record<string, BadgeTone> = {
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

function BookingRow({ booking }: { booking: Booking }) {
  const transition = useTransitionBooking();
  // Only transitions the API lets a *provider* make — see libs/service-bookings.ts.
  const actions = providerActions(booking.status);

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Booking {booking.bookingNumber}</p>
          <p className="mt-0.5 text-xs text-muted">
            {booking.scheduledStartAt ? (
              <>
                <CalendarClock className="mr-1 inline size-3.5" aria-hidden />
                <time dateTime={booking.scheduledStartAt}>{formatDateTime(booking.scheduledStartAt)}</time>
              </>
            ) : (
              "No time scheduled yet"
            )}
          </p>
          {(booking.locationCity || booking.locationAddress) && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {[booking.locationAddress, booking.locationCity].filter(Boolean).join(", ")}
            </p>
          )}
          {booking.customerNote && <p className="mt-1.5 text-xs text-muted">“{booking.customerNote}”</p>}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={STATUS_TONE[booking.status] ?? "neutral"}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
          <span className="text-sm font-semibold tabular-nums">{formatMoney(booking.totalAmount)}</span>
          {booking.amountPaid > 0 && (
            <span className="text-xs text-success">{formatMoney(booking.amountPaid)} paid</span>
          )}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {actions.map((next) => (
            <Button
              key={next}
              type="button"
              size="sm"
              variant={next === "declined" || next === "cancelled" ? "ghost" : "outline"}
              disabled={transition.isPending}
              onClick={() =>
                transition.mutate(
                  { id: booking.id, status: next },
                  {
                    onSuccess: () => toast.success(`Booking ${booking.bookingNumber} is now ${BOOKING_STATUS_LABELS[next].toLowerCase()}`),
                    onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't update that booking."),
                  },
                )
              }
            >
              {BOOKING_ACTION_LABELS[next] ?? BOOKING_STATUS_LABELS[next]}
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}

function QuoteForm({ quotation, onDone }: { quotation: Quotation; onDone: () => void }) {
  const send = useSendQuote();
  const [amount, setAmount] = useState(quotation.quotedAmount ? String(quotation.quotedAmount) : "");
  const [message, setMessage] = useState(quotation.providerMessage ?? "");
  const [duration, setDuration] = useState(
    quotation.estimatedDurationMinutes ? String(quotation.estimatedDurationMinutes) : "",
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!amount) return;
    send.mutate(
      {
        id: quotation.id,
        amount: Number(amount),
        message: message.trim() || null,
        durationMinutes: duration ? Number(duration) : null,
      },
      {
        onSuccess: () => {
          toast.success("Quote sent");
          onDone();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't send that quote."),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 border-t border-line pt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium">Your price (GH₵)</span>
          <input
            className={inputClass}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium">Estimated minutes</span>
          <input
            className={inputClass}
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium">Message to the customer</span>
        <textarea
          className={`${inputClass} h-20 resize-y py-3`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's included, and anything you need from them."
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={send.isPending || !amount}>
          {send.isPending ? "Sending…" : "Send quote"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function QuotationRow({ quotation }: { quotation: Quotation }) {
  const [quoting, setQuoting] = useState(false);

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Enquiry {quotation.reference}</p>
          <p className="mt-1 text-sm text-muted">“{quotation.customerBrief}”</p>
          <p className="mt-1 text-xs text-muted">
            {[
              quotation.locationCity,
              quotation.preferredDate ? `prefers ${quotation.preferredDate}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={quotation.status === "accepted" ? "success" : quotation.status === "requested" ? "warning" : "neutral"}>
            {quotation.status}
          </Badge>
          {quotation.quotedAmount !== null && (
            <span className="text-sm font-semibold tabular-nums">{formatMoney(quotation.quotedAmount)}</span>
          )}
        </div>
      </div>

      {quotation.status === "requested" && !quoting && (
        <Button type="button" size="sm" className="mt-3" onClick={() => setQuoting(true)}>
          <MessageSquareQuote className="size-4" aria-hidden />
          Send a quote
        </Button>
      )}
      {quoting && <QuoteForm quotation={quotation} onDone={() => setQuoting(false)} />}
    </li>
  );
}

/** Provider view of service bookings and quotation requests. */
export function VendorBookingsView() {
  const bookings = useProviderBookings();
  const quotations = useProviderQuotations();
  const [queue, setQueue] = useState<"open" | "done" | "quotes">("open");

  const rows = useMemo(() => bookings.data ?? [], [bookings.data]);
  const open = rows.filter((b) => isBookingOpen(b.status));
  const done = rows.filter((b) => !isBookingOpen(b.status));
  const quotes = quotations.data ?? [];

  if (bookings.isError && quotations.isError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Bookings" description="Service bookings and enquiries from customers." />
        <EmptyState
          icon={<Wrench className="size-10 text-muted" aria-hidden />}
          iconBadge
          title="Services aren't enabled yet"
          description="The ODOS services marketplace isn't live on this environment."
        />
      </div>
    );
  }

  const list = queue === "open" ? open : queue === "done" ? done : [];

  return (
    <div className="space-y-5">
      <PageHeader title="Bookings" description="Service bookings and quotation requests from customers." />

      <SegmentedControl
        label="Booking queue"
        value={queue}
        onChange={setQueue}
        options={[
          { value: "open", label: "Open", count: open.length },
          { value: "done", label: "Closed", count: done.length },
          { value: "quotes", label: "Enquiries", count: quotes.filter((q) => q.status === "requested").length },
        ]}
      />

      {bookings.isPending || quotations.isPending ? (
        <SkeletonRows count={3} />
      ) : queue === "quotes" ? (
        quotes.length === 0 ? (
          <EmptyState
            icon={<MessageSquareQuote className="size-10 text-muted" aria-hidden />}
            title="No enquiries yet"
            description="When a customer asks for a quote on one of your services, it appears here."
          />
        ) : (
          <Panel>
            <PanelHeader title={`Quotation requests (${quotes.length})`} />
            <ul className="divide-y divide-line">
              {quotes.map((q) => (
                <QuotationRow key={q.id} quotation={q} />
              ))}
            </ul>
          </Panel>
        )
      ) : list.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="size-10 text-muted" aria-hidden />}
          title={queue === "open" ? "No open bookings" : "Nothing closed yet"}
          description={
            queue === "open"
              ? "New service bookings will appear here as customers book you."
              : "Completed and cancelled bookings collect here."
          }
        />
      ) : (
        <Panel>
          <PanelHeader title={queue === "open" ? `Open bookings (${open.length})` : `Closed (${done.length})`} />
          <ul className="divide-y divide-line">
            {list.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
