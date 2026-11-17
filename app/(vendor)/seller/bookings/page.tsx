import type { Metadata } from "next";
import { VendorBookingsView } from "@/components/vendor/services/vendor-bookings-view";

export const metadata: Metadata = { title: "Bookings" };

export default function SellerBookingsPage() {
  return <VendorBookingsView />;
}
