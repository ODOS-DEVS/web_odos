import type { Metadata } from "next";
import { CheckoutResult } from "@/components/checkout/checkout-result";
import { first } from "@/libs/url";

export const metadata: Metadata = { title: "Payment result", robots: { index: false } };

export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const raw = await searchParams;
  // The hosted payment page appends the reference as `reference` (and sometimes `trxref`).
  const reference = first(raw.reference) ?? first(raw.trxref);
  return <CheckoutResult reference={reference} />;
}
