import type { Metadata } from "next";
import { VendorNotificationsView } from "@/components/vendor/vendor-notifications-view";

export const metadata: Metadata = { title: "Notifications" };

export default function SellerNotificationsPage() {
  return <VendorNotificationsView />;
}
