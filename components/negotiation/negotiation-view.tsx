"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Check, MessageCircle, ShoppingCart, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { inputClass } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { NegotiationOutcome, OfferCard } from "@/components/negotiation/offer-card";
import { useAcceptOffer, useCounterOffer, useNegotiation, useRejectOffer, useWithdrawOffer } from "@/hooks/use-negotiations";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import type { NegotiationActor } from "@/types/negotiation";

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

/** Counts a server-issued deadline down without trusting the browser's clock for the start. */
function Countdown({ seconds }: { seconds: number }) {
  if (seconds <= 0) return <span className="font-semibold text-danger">expired</span>;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return (
    <span className={cn("font-semibold", hours < 2 && "text-danger")}>
      {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
    </span>
  );
}

/**
 * One negotiation, from either side.
 *
 * The same component serves shopper and vendor: the actions available are decided by
 * `viewerRole` and by whose move it is, which the server also enforces — so a button that
 * should not be here being rendered anyway would still fail the request.
 */
export function NegotiationView({
  negotiationId,
  viewerRole,
  backHref,
}: {
  negotiationId: string;
  viewerRole: NegotiationActor;
  backHref: string;
}) {
  const query = useNegotiation(negotiationId);
  const counter = useCounterOffer();
  const accept = useAcceptOffer();
  const reject = useRejectOffer();
  const withdraw = useWithdrawOffer();

  const [countering, setCountering] = useState(false);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  if (query.isError) {
    return (
      <Container className="py-12">
        <QueryError title="We couldn't load this negotiation" error={query.error} onRetry={() => query.refetch()} />
      </Container>
    );
  }
  if (query.isPending || !query.data) {
    return (
      <Container className="py-12">
        <div className="h-64 animate-pulse rounded-3xl bg-surface-muted" aria-busy="true" />
      </Container>
    );
  }

  const n = query.data;
  const pending = n.latestOffer?.status === "pending" ? n.latestOffer : null;
  const myMove = n.awaiting === viewerRole;
  const mineIsPending = Boolean(pending && pending.actorRole === viewerRole);
  const busy = counter.isPending || accept.isPending || reject.isPending || withdraw.isPending;
  const agreement = n.agreement;
  const live = agreement?.status === "accepted" && agreement.secondsRemaining > 0;

  const onError = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : "That didn't work. Try again.");

  return (
    <Container className="py-6 sm:py-10">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All negotiations
      </Link>

      <header className="mt-4 flex flex-wrap items-start gap-4 rounded-3xl border border-line bg-surface p-5">
        <Media src={n.productImageUrl} name={n.productTitle} sizes="80px" className="size-20 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">{n.reference}</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{n.productTitle}</h1>
          <p className="mt-1 text-sm text-muted">
            {viewerRole === "vendor" ? (n.customerName ?? "Shopper") : (n.storeName ?? "Seller")} · listed at{" "}
            {formatMoney(n.listedUnitPrice)}
            {n.currentListedPrice !== null && n.currentListedPrice !== n.listedUnitPrice && (
              <span> · now {formatMoney(n.currentListedPrice)}</span>
            )}
          </p>
          {(n.selectedColor || n.selectedSize) && (
            <p className="mt-1 text-xs text-muted">
              {[n.selectedColor, n.selectedSize].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <ButtonLink href={`/stores/${n.storeId}/chat`} variant="outline" size="sm">
          <MessageCircle className="size-4" aria-hidden />
          Message
        </ButtonLink>
      </header>

      {agreement && (
        <section
          className={cn(
            "mt-5 rounded-3xl border p-5",
            live ? "border-success/40 bg-success/5" : "border-line bg-surface-muted/50",
          )}
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <Check className="size-4 text-success" aria-hidden />
            {agreement.status === "used"
              ? "Bought at the agreed price"
              : live
                ? "Price agreed"
                : "This agreed price has expired"}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {formatMoney(agreement.agreedUnitPrice)}
            <span className="ml-1.5 text-sm font-medium text-muted">each</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {agreement.quantity} {agreement.quantity === 1 ? "unit" : "units"} ·{" "}
            <span className="font-medium text-foreground">
              {formatMoney(agreement.agreedUnitPrice * agreement.quantity)}
            </span>{" "}
            total · down from {formatMoney(agreement.listedUnitPrice)}
          </p>
          <p className="mt-1 text-xs text-muted">Agreement {agreement.reference}</p>

          {live && viewerRole === "customer" && (
            <>
              <p className="mt-3 text-sm">
                Expires in <Countdown seconds={agreement.secondsRemaining} /> — only you can use this price.
              </p>
              <ButtonLink href={`/products/${n.productId}`} variant="accent" className="mt-3 w-full sm:w-auto">
                <ShoppingCart className="size-4" aria-hidden />
                Buy at {formatMoney(agreement.agreedUnitPrice)}
              </ButtonLink>
            </>
          )}
          {live && viewerRole === "vendor" && (
            <p className="mt-3 text-sm text-muted">
              Waiting for the buyer to check out · expires in <Countdown seconds={agreement.secondsRemaining} />
            </p>
          )}
          {agreement.status === "used" && agreement.orderNumber && (
            <p className="mt-3 text-sm text-muted">Order {agreement.orderNumber}</p>
          )}
          {agreement.status === "expired" && viewerRole === "customer" && (
            <ButtonLink href={`/products/${n.productId}`} variant="outline" className="mt-3">
              Negotiate again
            </ButtonLink>
          )}
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">History</h2>
        <ul className="mt-3 space-y-3">
          {n.offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} viewerRole={viewerRole} listedPrice={n.listedUnitPrice} />
          ))}
        </ul>
        {(n.status === "rejected" || n.status === "withdrawn" || n.status === "expired") && !agreement && (
          <NegotiationOutcome status={n.status} className="mt-4" />
        )}
      </section>

      {n.status === "open" && (
        <section className="mt-6 rounded-3xl border border-line bg-surface p-5">
          {myMove && pending ? (
            <>
              <p className="text-sm font-semibold">
                {pending.actorRole === "vendor" ? "The seller" : "The buyer"} proposed{" "}
                {formatMoney(pending.unitPrice)} each for {pending.quantity}.
              </p>
              {!countering ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      accept.mutate(
                        { id: n.id },
                        { onSuccess: () => toast.success("Price agreed"), onError },
                      )
                    }
                  >
                    <Check className="size-4" aria-hidden />
                    Accept {formatMoney(pending.unitPrice)}
                  </Button>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => setCountering(true)}>
                    Counter
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      reject.mutate(
                        { id: n.id, message: null },
                        { onSuccess: () => toast.success("Offer declined"), onError },
                      )
                    }
                  >
                    <X className="size-4" aria-hidden />
                    Decline
                  </Button>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">Your price per unit</span>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      autoFocus
                      value={price}
                      onChange={(event) => setPrice(digitsOnly(event.target.value))}
                    />
                  </label>
                  <textarea
                    className={cn(inputClass, "h-20 resize-y py-3")}
                    placeholder="Optional message"
                    maxLength={500}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={busy || !price}
                      onClick={() =>
                        counter.mutate(
                          { id: n.id, unitPrice: Number(price), message: note.trim() || null },
                          {
                            onSuccess: () => {
                              toast.success("Counteroffer sent");
                              setCountering(false);
                              setPrice("");
                              setNote("");
                            },
                            onError,
                          },
                        )
                      }
                    >
                      Send counteroffer
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setCountering(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : mineIsPending ? (
            <>
              <p className="text-sm text-muted">
                Waiting for {viewerRole === "customer" ? "the seller" : "the buyer"} to respond to your{" "}
                {formatMoney(pending!.unitPrice)} offer.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={busy}
                onClick={() =>
                  withdraw.mutate({ id: n.id }, { onSuccess: () => toast.success("Offer withdrawn"), onError })
                }
              >
                Withdraw my offer
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted">
              No offer is on the table. {viewerRole === "customer" ? "Make one" : "Propose a price"} to keep going.
            </p>
          )}
        </section>
      )}
    </Container>
  );
}
