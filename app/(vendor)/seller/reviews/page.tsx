import type { Metadata } from "next";
import { VendorReviewsTab } from "@/components/vendor/vendor-reviews-tab";
import { PageHeader } from "@/components/vendor/vendor-ui";

export const metadata: Metadata = { title: "Reviews" };

export default function SellerReviewsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Reviews" description="What shoppers said about your products — and your replies." />
      <VendorReviewsTab />
    </div>
  );
}
