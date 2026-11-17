import type { Metadata } from "next";
import { VendorCustomersTab } from "@/components/vendor/vendor-customers-tab";
import { PageHeader } from "@/components/vendor/vendor-ui";

export const metadata: Metadata = { title: "Customers" };

export default function SellerCustomersPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Customers" description="Everyone who has bought from your store." />
      <VendorCustomersTab />
    </div>
  );
}
