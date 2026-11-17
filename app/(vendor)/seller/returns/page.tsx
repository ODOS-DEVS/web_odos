import type { Metadata } from "next";
import { VendorReturnsTab } from "@/components/vendor/vendor-returns-tab";
import { PageHeader } from "@/components/vendor/vendor-ui";

export const metadata: Metadata = { title: "Returns" };

export default function SellerReturnsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Returns" description="Refund and exchange requests from your customers." />
      <VendorReturnsTab />
    </div>
  );
}
