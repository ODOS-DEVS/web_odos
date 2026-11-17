import type { Metadata } from "next";
import { VendorSettingsView } from "@/components/vendor/vendor-settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SellerSettingsPage() {
  return <VendorSettingsView />;
}
