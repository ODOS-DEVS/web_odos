import type { Metadata } from "next";
import { VendorWalletTab } from "@/components/vendor/vendor-wallet-tab";
import { PageHeader } from "@/components/vendor/vendor-ui";

export const metadata: Metadata = { title: "Earnings" };

export default function SellerWalletPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Earnings" description="Your balance, transactions and payouts." />
      <VendorWalletTab />
    </div>
  );
}
