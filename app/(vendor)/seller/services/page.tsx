import type { Metadata } from "next";
import { VendorServicesView } from "@/components/vendor/services/vendor-services-view";

export const metadata: Metadata = { title: "Services" };

export default function SellerServicesPage() {
  return <VendorServicesView />;
}
