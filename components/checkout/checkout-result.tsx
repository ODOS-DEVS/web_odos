"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { ButtonLink, Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { forgetPendingPayment } from "@/libs/pending-payment";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import { paymentQueries } from "@/services/queries";

/**
 * Where the hosted payment page sends the shopper back. It asks the API whether the payment really
 * went through (never trusting the redirect alone), and only then empties the cart.
 */
export function CheckoutResult({ reference }: { reference?: string }) {
  const { clear } = useCart();

  const verification = useQuery({ ...paymentQueries.verify(reference ?? ""), enabled: Boolean(reference) });

  const paid = verification.data?.paid;
  useEffect(() => {
    if (!paid) return;
    clear();
  }, [paid, clear]);

  // Settled one way or the other, so there is nothing left to come back to.
  // Clearing this is what stops the resumer sending them here again.
  const settled = verification.data ? !verification.data.pending : false;
  useEffect(() => {
    if (!settled) return;
    forgetPendingPayment();
  }, [settled]);

  let body;
  if (!reference) {
    body = (
      <>
        <AlertTriangle className="size-10 text-warning" aria-hidden />
        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">No payment to confirm</h1>
        <p className="mt-3 max-w-md text-muted">We couldn’t find a payment reference. If you were charged, check your orders.</p>
      </>
    );
  } else if (verification.isPending) {
    body = (
      <>
        <Loader2 className="size-10 animate-spin text-muted" aria-hidden />
        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Confirming your payment…</h1>
        <p className="mt-3 max-w-md text-muted">This only takes a moment. Please don’t close this page.</p>
      </>
    );
  } else if (verification.isError) {
    body = (
      <>
        <AlertTriangle className="size-10 text-warning" aria-hidden />
        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">We couldn’t confirm your payment</h1>
        <p className="mt-3 max-w-md text-muted">
          {verification.error instanceof Error ? verification.error.message : "Something went wrong."} If you were charged, your order will still appear in
          your orders.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => verification.refetch()}>
          Check again
        </Button>
      </>
    );
  } else if (verification.data.paid) {
    const { order } = verification.data;
    body = (
      <>
        <span className="rise-in grid size-20 place-items-center rounded-full bg-success-soft">
          <CheckCircle2 className="size-10 text-success" aria-hidden />
        </span>
        <h1 className="rise-in mt-6 text-3xl font-semibold sm:text-4xl">Thank you, your order is in</h1>
        <p className="rise-in mt-3 max-w-md text-muted">
          Order <span className="font-medium text-foreground">{order.number}</span> · {formatMoney(order.total)}. Each vendor will confirm and pack
          their part, and you can follow every package separately.
        </p>
      </>
    );
  } else if (verification.data.pending) {
    body = (
      <>
        <Loader2 className="size-10 animate-spin text-muted" aria-hidden />
        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Waiting for your payment</h1>
        <p className="mt-3 max-w-md text-muted">
          Approve the prompt on your phone to finish paying. This page updates itself the moment it
          comes through — you don’t need to do anything else here.
        </p>
      </>
    );
  } else {
    body = (
      <>
        <AlertTriangle className="size-10 text-warning" aria-hidden />
        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Payment not completed</h1>
        <p className="mt-3 max-w-md text-muted">{verification.data.message || "Your payment didn’t go through, and you haven’t been charged."}</p>
      </>
    );
  }

  const ok = paid === true;
  const waiting = verification.isPending || verification.data?.pending === true;
  return (
    <Container className="grid place-items-center py-24 text-center">
      {body}
      <div className={cn("mt-8 flex flex-wrap justify-center gap-3", waiting && "hidden")}>
        <ButtonLink href={ok && verification.data ? `/orders/${verification.data.order.id}` : "/orders"} size="lg">
          {ok ? "Track your order" : "View your orders"}
        </ButtonLink>
        <ButtonLink href={ok ? "/products" : "/cart"} size="lg" variant="outline">
          {ok ? "Keep shopping" : "Back to cart"}
        </ButtonLink>
      </div>
    </Container>
  );
}
