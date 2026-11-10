"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, X } from "lucide-react";
import {
  forgetPendingPayment,
  pendingPaymentServerSnapshot,
  pendingPaymentSnapshot,
  subscribePendingPayment,
} from "@/libs/pending-payment";

/**
 * Offers a way back to a payment the shopper left mid-flight.
 *
 * KutanaPay cannot redirect anyone back -- see libs/pending-payment -- so
 * someone who closes the provider's tab would otherwise return to the site
 * with their order sitting unconfirmed and no sign of it anywhere.
 *
 * It *offers*, and does not navigate. An earlier version redirected to the
 * result page on sight, which trapped anyone whose payment never completed:
 * every page they opened bounced them back to a screen waiting on a charge
 * that was never coming, and the only way out was to log out. A payment left
 * unfinished is a thing to mention, never a thing to seize the session over.
 */
export function PendingPaymentResumer() {
  const pathname = usePathname();
  // Subscribed rather than read once, so clearing it -- here, on the result
  // screen, or in the tab next door -- takes this away immediately.
  const pending = useSyncExternalStore(
    subscribePendingPayment,
    pendingPaymentSnapshot,
    pendingPaymentServerSnapshot,
  );

  const onResultScreen =
    pathname.startsWith("/checkout/success") || pathname.startsWith("/account");
  if (!pending || onResultScreen) return null;

  const href =
    pending.kind === "topup"
      ? `/account?tab=wallet&topup=${encodeURIComponent(pending.reference)}`
      : `/checkout/success?reference=${encodeURIComponent(pending.reference)}`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-line bg-surface px-4 py-2.5 text-sm shadow-lg"
      >
        <Loader2 className="size-4 shrink-0 animate-spin text-muted" aria-hidden />
        <span className="truncate">
          {pending.kind === "topup" ? "A top-up is still unconfirmed." : "A payment is still unconfirmed."}
        </span>
        <Link href={href} className="press shrink-0 font-medium text-accent underline-offset-4 hover:underline">
          Check it
        </Link>
        <button
          type="button"
          // Dismissing forgets the stash rather than merely hiding this: a
          // shopper who walked away from a payment should not be asked again
          // on every page, and the order is still in their orders either way.
          onClick={forgetPendingPayment}
          aria-label="Dismiss"
          className="press shrink-0 text-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
