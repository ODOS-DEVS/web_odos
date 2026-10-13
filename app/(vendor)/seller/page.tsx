import type { Metadata } from "next";
import { VendorAccountView } from "@/components/vendor/vendor-account-view";

// Private to the logged-in vendor, same as /account.
export const metadata: Metadata = { title: "Vendor Account", robots: { index: false } };

export default function SellerPage() {
  return <VendorAccountView />;
}
