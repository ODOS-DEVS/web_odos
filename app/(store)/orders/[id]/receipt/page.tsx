import type { Metadata } from "next";
import { RequireLogin } from "@/components/auth/require-login";
import { ReceiptView } from "@/components/orders/receipt-view";

// A receipt is private to the shopper who placed the order.
export const metadata: Metadata = { title: "Receipt", robots: { index: false } };

export default async function ReceiptPage({ params }: PageProps<"/orders/[id]/receipt">) {
  const { id } = await params;
  return (
    <RequireLogin next={`/orders/${id}/receipt`} message="Log in to view this receipt.">
      <ReceiptView id={id} />
    </RequireLogin>
  );
}
