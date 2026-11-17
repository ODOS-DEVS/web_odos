import type { Metadata } from "next";
import { DeliverySettingsView } from "@/components/vendor/store/delivery-settings-view";

export const metadata: Metadata = { title: "Delivery" };

export default function SellerDeliveryPage() {
  return <DeliverySettingsView />;
}
