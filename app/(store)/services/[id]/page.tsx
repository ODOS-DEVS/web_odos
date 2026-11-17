import type { Metadata } from "next";
import { ServiceDetailView } from "@/components/services/service-detail-view";

export const metadata: Metadata = { title: "Service" };

export default async function ServicePage({ params }: PageProps<"/services/[id]">) {
  const { id } = await params;
  return <ServiceDetailView id={id} />;
}
