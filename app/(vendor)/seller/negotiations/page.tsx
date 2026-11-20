import type { Metadata } from "next";
import { NegotiationsPage } from "@/components/negotiation/negotiations-page";

export const metadata: Metadata = { title: "Negotiations" };

export default function SellerNegotiationsPage() {
  return (
    <NegotiationsPage
      viewerRole="vendor"
      basePath="/seller/negotiations"
      title="Negotiations"
      description="Offers from shoppers on your negotiable products."
      bare
    />
  );
}
