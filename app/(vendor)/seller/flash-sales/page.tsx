import type { Metadata } from "next";
import { FlashSalesView } from "@/components/vendor/store/flash-sales-view";

export const metadata: Metadata = { title: "Flash sales" };

export default function SellerFlashSalesPage() {
  return <FlashSalesView />;
}
