"use client";

import { ArrowRight, Check, Clock, Handshake, X } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import type { NegotiationActor, NegotiationOffer } from "@/types/negotiation";

const STATUS_TONE: Record<NegotiationOffer["status"], BadgeTone> = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
  withdrawn: "neutral",
  superseded: "neutral",
};

const STATUS_LABEL: Record<NegotiationOffer["status"], string> = {
  pending: "Awaiting reply",
  accepted: "Accepted",
  rejected: "Declined",
  withdrawn: "Withdrawn",
  superseded: "Countered",
};

/**
 * One move in a negotiation, rendered from the offer row rather than from message text — so
 * what the card claims can never drift from the state machine behind it.
 *
 * Aligned by author like a chat bubble: the reader's own moves sit right, the other side's
 * left, which is how both parties read a back-and-forth without labels on every row.
 */
export function OfferCard({
  offer,
  viewerRole,
  listedPrice,
  className,
}: {
  offer: NegotiationOffer;
  viewerRole: NegotiationActor;
  listedPrice: number;
  className?: string;
}) {
  const mine = offer.actorRole === viewerRole;
  const total = offer.unitPrice * offer.quantity;
  const off = listedPrice > 0 ? Math.round((1 - offer.unitPrice / listedPrice) * 100) : 0;

  return (
    <li className={cn("flex", mine ? "justify-end" : "justify-start", className)}>
      <div
        className={cn(
          "w-full max-w-sm rounded-2xl border p-4",
          offer.status === "accepted"
            ? "border-success/40 bg-success/5"
            : offer.status === "pending"
              ? "border-accent/40 bg-surface"
              : "border-line bg-surface-muted/50",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-muted">
            <Handshake className="size-3.5" aria-hidden />
            {mine ? "Your offer" : offer.actorRole === "vendor" ? "Seller's offer" : "Buyer's offer"}
          </span>
          <Badge tone={STATUS_TONE[offer.status]}>{STATUS_LABEL[offer.status]}</Badge>
        </div>

        <p className="mt-2.5 text-2xl font-bold tracking-tight">
          {formatMoney(offer.unitPrice)}
          <span className="ml-1.5 text-sm font-medium text-muted">each</span>
        </p>

        <p className="mt-1 text-sm text-muted">
          {offer.quantity} {offer.quantity === 1 ? "unit" : "units"} ·{" "}
          <span className="font-medium text-foreground">{formatMoney(total)}</span> total
          {off > 0 && <span className="ml-1.5">({off}% off list)</span>}
        </p>

        {offer.message && (
          <p className="mt-2.5 rounded-xl bg-surface-muted px-3 py-2 text-sm leading-5">
            “{offer.message}”
          </p>
        )}

        <p className="mt-2.5 flex items-center gap-1 text-[11px] text-muted">
          <Clock className="size-3" aria-hidden />
          {new Date(offer.createdAt).toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </li>
  );
}

/** The outcome banner shown once a negotiation has stopped moving. */
export function NegotiationOutcome({
  status,
  className,
}: {
  status: "rejected" | "withdrawn" | "expired";
  className?: string;
}) {
  const copy = {
    rejected: { icon: X, text: "This negotiation was declined." },
    withdrawn: { icon: ArrowRight, text: "This negotiation was withdrawn." },
    expired: { icon: Clock, text: "The agreed price expired before checkout." },
  }[status];
  const Icon = copy.icon;

  return (
    <p
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {copy.text}
    </p>
  );
}

/** Small tick used in the agreed banner. */
export const AgreedTick = () => <Check className="size-4" aria-hidden />;
