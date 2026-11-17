"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import { rememberPendingPayment } from "@/libs/pending-payment";
import { useSession } from "@/hooks/use-auth";
import { useBookingCheckout, useBookingQuote, useCreateBooking, useServiceSlots } from "@/hooks/use-services";
import type { BookingDraft, ServiceDetail } from "@/types/services";

/** Seven bookable days starting today, which is as far ahead as a slot grid stays useful. */
function nextDays(count = 7) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date.toISOString().slice(0, 10);
  });
}

const dayLabel = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`);
  const today = new Date().toISOString().slice(0, 10);
  if (iso === today) return "Today";
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/**
 * Configure and pay for a booking.
 *
 * The money model is escrow, and the panel says so plainly: the customer pays in full now, ODOS
 * holds it, and the provider is paid once the work is confirmed. Hiding that would make a
 * full-price upfront charge feel like a risk rather than a protection.
 *
 * The quote shown is the API's advisory figure. The booking reprices server-side on write, so
 * nothing here is treated as the amount actually charged.
 */
export function BookingPanel({ service }: { service: ServiceDetail }) {
  const router = useRouter();
  const session = useSession();
  const [packageId, setPackageId] = useState<string | null>(service.packages[0]?.id ?? null);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [day, setDay] = useState<string | null>(null);
  const [startAt, setStartAt] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const create = useCreateBooking();
  const checkout = useBookingCheckout();

  const draft: BookingDraft = useMemo(
    () => ({
      packageId,
      addons: Object.entries(addonQty)
        .filter(([, qty]) => qty > 0)
        .map(([addonId, quantity]) => ({ addonId, quantity })),
      startAt,
      locationAddress: address.trim() || null,
      customerNote: note.trim() || null,
    }),
    [packageId, addonQty, startAt, address, note],
  );

  const quote = useBookingQuote(service.id, draft);
  const slots = useServiceSlots(service.id, day, { packageId });

  // `instant` means the slot is held outright; `request` needs the provider to accept first, so
  // a time is a preference rather than a commitment.
  const needsSlot = service.bookingType === "instant";

  const onBook = async () => {
    if (!session) {
      router.push(`/login?next=/services/${service.id}`);
      return;
    }
    if (needsSlot && !startAt) {
      toast.error("Pick a time for your booking.");
      return;
    }

    setBusy(true);
    try {
      const booking = await create.mutateAsync({ serviceId: service.id, draft });
      const { checkoutUrl, reference } = await checkout.mutateAsync(booking.id);

      if (!checkoutUrl) {
        // No gateway session: the booking exists and is awaiting payment, so send them to where
        // they can settle it rather than pretending the flow failed.
        toast.success("Booking created. Finish payment from your bookings.");
        router.push("/account?tab=bookings");
        return;
      }

      // Stashed so the return screen knows what came back, even on a bare redirect.
      if (reference) rememberPendingPayment(reference, "booking");
      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't start that booking.");
    } finally {
      setBusy(false);
    }
  };

  const quoteTotal = quote.data?.totalAmount ?? service.basePrice;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      {service.packages.length > 0 && (
        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-semibold">Choose a package</legend>
          <div className="space-y-2">
            {service.packages.map((pkg) => (
              <label
                key={pkg.id}
                className={cn(
                  "press flex cursor-pointer items-start gap-3 rounded-xl border p-3",
                  packageId === pkg.id ? "border-accent bg-accent-soft/40" : "border-line hover:border-foreground",
                )}
              >
                <input
                  type="radio"
                  name="package"
                  checked={packageId === pkg.id}
                  onChange={() => setPackageId(pkg.id)}
                  className="mt-0.5 size-4 accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{pkg.name}</span>
                  {pkg.description && <span className="mt-0.5 block text-xs text-muted">{pkg.description}</span>}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(pkg.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {service.addons.length > 0 && (
        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-semibold">Add extras</legend>
          <div className="space-y-2">
            {service.addons.map((addon) => (
              <div key={addon.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{addon.name}</span>
                  <span className="block text-xs text-muted">+{formatMoney(addon.price)}</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={addon.maxQuantity}
                  value={addonQty[addon.id] ?? 0}
                  onChange={(event) =>
                    setAddonQty((q) => ({
                      ...q,
                      [addon.id]: Math.max(0, Math.min(addon.maxQuantity, Number(event.target.value) || 0)),
                    }))
                  }
                  aria-label={`Quantity of ${addon.name}`}
                  className={cn(inputClass, "h-9 w-16 text-center")}
                />
              </div>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-semibold">
          {needsSlot ? "Pick a time" : "Preferred date"}
          {!needsSlot && <span className="ml-1.5 text-xs font-normal text-muted">the provider confirms</span>}
        </legend>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {nextDays().map((iso) => (
            <button
              key={iso}
              type="button"
              onClick={() => {
                setDay(iso);
                setStartAt(null);
              }}
              className={cn(
                "press shrink-0 rounded-xl border px-3 py-2 text-xs font-medium",
                day === iso ? "border-foreground bg-foreground text-background" : "border-line hover:border-foreground",
              )}
            >
              {dayLabel(iso)}
            </button>
          ))}
        </div>

        {day && (
          <div className="mt-3">
            {slots.isPending ? (
              <p className="flex items-center gap-2 text-xs text-muted">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Checking availability…
              </p>
            ) : slots.isError ? (
              <p className="text-xs text-muted">
                We couldn&apos;t load times. {needsSlot ? "Try another day." : "You can still send a request."}
              </p>
            ) : !slots.data?.length ? (
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                Nothing free on {dayLabel(day).toLowerCase()}. Try another day.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.data.map((slot) => (
                  <button
                    key={slot.startAt}
                    type="button"
                    onClick={() => setStartAt(slot.startAt)}
                    className={cn(
                      "press rounded-full border px-3 py-1.5 text-xs font-medium",
                      startAt === slot.startAt
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-line hover:border-foreground",
                    )}
                  >
                    {timeLabel(slot.startAt)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </fieldset>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-semibold">Where</span>
        <input
          className={inputClass}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          maxLength={500}
          placeholder="Street or landmark"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-semibold">Anything they should know</span>
        <textarea
          className={cn(inputClass, "h-20 resize-y py-3")}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={2000}
        />
      </label>

      <dl className="space-y-1.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Service</dt>
          <dd className="tabular-nums">{formatMoney(quote.data?.baseAmount ?? service.basePrice)}</dd>
        </div>
        {(quote.data?.addonsAmount ?? 0) > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Extras</dt>
            <dd className="tabular-nums">{formatMoney(quote.data!.addonsAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-line pt-1.5 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(quoteTotal)}</dd>
        </div>
        {quote.isPending && <p className="text-xs text-muted">Pricing this…</p>}
        <p className="pt-1 text-xs text-muted">
          An estimate — the final amount is confirmed when the booking is created.
        </p>
      </dl>

      <div className="mt-4 rounded-xl bg-surface-muted p-3">
        <p className="flex items-start gap-2 text-xs leading-5 text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          <span>
            You pay <strong className="text-foreground">{formatMoney(quoteTotal)}</strong> now and{" "}
            <strong className="text-foreground">ODOS holds it</strong>. The provider is only paid once you
            confirm the work is done — or automatically 48 hours after they mark it complete, so nobody is
            left chasing. Raise a problem instead and ODOS steps in.
          </span>
        </p>
      </div>

      {session ? (
        <Button type="button" size="lg" className="mt-4 w-full" onClick={() => void onBook()} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Starting…
            </>
          ) : (
            <>
              <Lock className="size-4" aria-hidden />
              {needsSlot ? "Book and pay" : "Request and pay"}
            </>
          )}
        </Button>
      ) : (
        <ButtonLink href={`/login?next=/services/${service.id}`} size="lg" className="mt-4 w-full">
          Sign in to book
        </ButtonLink>
      )}

      <p className="mt-2 text-center text-xs text-muted">
        <Badge tone="neutral">{service.bookingType === "instant" ? "Instant booking" : "Provider confirms first"}</Badge>
      </p>
    </div>
  );
}
