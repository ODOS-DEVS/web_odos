"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { readPendingPayment } from "@/libs/pending-payment";

const RESULT_PATH = "/checkout/success";
/** Top-ups settle on the wallet itself, which is where the balance they are watching lives. */
const WALLET_PATH = "/account";

/**
 * Brings a shopper back to a payment they left mid-flight.
 *
 * KutanaPay cannot redirect anyone back -- see libs/pending-payment -- so
 * someone who pays and then closes the tab, or whose popup was blocked and had
 * the whole tab handed to the provider, would otherwise return to the site with
 * their order sitting unconfirmed and no sign of it anywhere.
 *
 * The result page is the right place for them: it confirms the charge, empties
 * the cart and hands them straight to the order. It also clears the stash once
 * the payment settles, which is what keeps this from firing twice.
 */
export function PendingPaymentResumer() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const pending = readPendingPayment();
    if (!pending) return;
    const reference = encodeURIComponent(pending.reference);

    if (pending.kind === "topup") {
      // The wallet tab confirms it in place, so sending them anywhere else
      // would only move them away from the balance they are waiting on.
      if (pathname.startsWith(WALLET_PATH)) return;
      router.replace(`${WALLET_PATH}?tab=wallet&topup=${reference}`);
      return;
    }

    // Already there, or on the way: nothing to resume.
    if (pathname.startsWith(RESULT_PATH)) return;
    router.replace(`${RESULT_PATH}?reference=${reference}`);
  }, [pathname, router]);

  return null;
}
