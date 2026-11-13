"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import {
  pendingPaymentServerSnapshot,
  pendingPaymentSnapshot,
  subscribePendingPayment,
} from "@/libs/pending-payment";

/**
 * Forwards a shopper coming back from the payment provider to whichever
 * screen settles what they were paying for.
 *
 * Nothing is verified here — the destination does that. This exists only
 * because KutanaPay allows one redirect URL per merchant account, so orders
 * and wallet top-ups have to arrive at the same door and be sorted out on
 * this side of it.
 */
export function PaymentReturn({
  reference,
  cancelled,
}: {
  reference?: string;
  cancelled?: boolean;
}) {
  const router = useRouter();

  const pending = useSyncExternalStore(
    subscribePendingPayment,
    pendingPaymentSnapshot,
    pendingPaymentServerSnapshot,
  );

  // The stash is in localStorage, so the server cannot read it. Waiting for
  // the client avoids forwarding an order payment to the wallet (or worse,
  // to "nothing to confirm") on the strength of a snapshot taken before
  // anyone had looked.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!hydrated) return;

    const params = new URLSearchParams();
    if (reference) params.set("reference", reference);
    if (cancelled) params.set("cancelled", "1");
    const query = params.toString();

    // A top-up settles on the wallet, where the balance they are waiting to
    // see change actually lives.
    if (pending?.kind === "topup") {
      const topupRef = reference ?? pending.reference;
      router.replace(`/account?tab=wallet&topup=${encodeURIComponent(topupRef)}`);
      return;
    }

    // Orders, and the no-stash case: the checkout result screen already
    // handles a missing reference honestly, and is the right place to land
    // if this browser has lost track of what was being paid for.
    router.replace(`/checkout/success${query ? `?${query}` : ""}`);
  }, [cancelled, hydrated, pending, reference, router]);

  return (
    <Container className="grid place-items-center py-24 text-center">
      <Loader2 className="size-10 animate-spin text-muted" aria-hidden />
      <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Bringing you back…</h1>
      <p className="mt-3 max-w-md text-muted">
        One moment while we pick your payment back up.
      </p>
    </Container>
  );
}
