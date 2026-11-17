import type { Metadata } from "next";
import { VendorAnalyticsView } from "@/components/vendor/vendor-analytics-view";

export const metadata: Metadata = { title: "Analytics" };

export default function SellerAnalyticsPage() {
  return <VendorAnalyticsView />;
}
