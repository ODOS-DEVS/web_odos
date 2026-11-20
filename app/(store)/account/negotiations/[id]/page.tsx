import type { Metadata } from "next";
import { NegotiationView } from "@/components/negotiation/negotiation-view";

export const metadata: Metadata = { title: "Negotiation" };

export default async function ShopperNegotiationPage({ params }: PageProps<"/account/negotiations/[id]">) {
  const { id } = await params;
  return <NegotiationView negotiationId={id} viewerRole="customer" backHref="/account/negotiations" />;
}
