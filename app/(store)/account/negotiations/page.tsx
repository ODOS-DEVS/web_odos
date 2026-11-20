import type { Metadata } from "next";
import { NegotiationsPage } from "@/components/negotiation/negotiations-page";

export const metadata: Metadata = { title: "My negotiations" };

export default function MyNegotiationsPage() {
  return (
    <NegotiationsPage
      viewerRole="customer"
      basePath="/account/negotiations"
      title="My negotiations"
      description="Offers you've made, prices you've agreed, and what's ready to buy."
    />
  );
}
