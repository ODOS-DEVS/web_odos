import type { Metadata } from "next";
import { NegotiationView } from "@/components/negotiation/negotiation-view";

export const metadata: Metadata = { title: "Negotiation" };

export default async function VendorNegotiationPage({ params }: PageProps<"/seller/negotiations/[id]">) {
  const { id } = await params;
  return <NegotiationView negotiationId={id} viewerRole="vendor" backHref="/seller/negotiations" />;
}
