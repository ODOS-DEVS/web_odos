import type { Metadata } from "next";
import { PaymentReturn } from "@/components/checkout/payment-return";
import { first } from "@/libs/url";

export const metadata: Metadata = { title: "Returning from payment", robots: { index: false } };

/**
 * The one address KutanaPay is told to send people back to.
 *
 * Their dashboard holds a single redirect URL for the whole merchant
 * account, but ODOS takes payments for two different things — orders and
 * wallet top-ups — which settle on different screens. This page is the
 * fork: it reads what the shopper actually started and forwards them there.
 */
export default async function PaymentReturnPage({ searchParams }: PageProps<"/payment/return">) {
  const raw = await searchParams;
  // Paystack appends these; KutanaPay's dashboard redirect arrives bare.
  // Passed through when present so the destination can skip the stash.
  const reference = first(raw.reference) ?? first(raw.trxref);
  const cancelled = first(raw.cancelled) === "1";
  // Stated by the backend when it built the redirect, so this works even on a
  // device that has no local record of the payment starting.
  const kind = first(raw.kind);
  return <PaymentReturn reference={reference} cancelled={cancelled} kind={kind} />;
}
