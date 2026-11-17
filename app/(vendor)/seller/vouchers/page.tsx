import type { Metadata } from "next";
import { VendorVouchersTab } from "@/components/vendor/vendor-vouchers-tab";
import { PageHeader } from "@/components/vendor/vendor-ui";

export const metadata: Metadata = { title: "Vouchers" };

export default function SellerVouchersPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Vouchers" description="Discount codes for your store. ODOS reviews each one before it goes live." />
      <VendorVouchersTab />
    </div>
  );
}
