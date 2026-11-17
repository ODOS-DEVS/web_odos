import type { Metadata } from "next";
import { VendorOrdersView } from "@/components/vendor/orders/vendor-orders-view";

export const metadata: Metadata = { title: "Orders" };

export default function SellerOrdersPage() {
  return <VendorOrdersView />;
}
