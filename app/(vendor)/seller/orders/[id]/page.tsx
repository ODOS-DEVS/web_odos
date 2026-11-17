import type { Metadata } from "next";
import { VendorOrderDetail } from "@/components/vendor/orders/vendor-order-detail";

export const metadata: Metadata = { title: "Order details" };

export default async function SellerOrderPage({ params }: PageProps<"/seller/orders/[id]">) {
  const { id } = await params;
  return <VendorOrderDetail orderId={id} />;
}
