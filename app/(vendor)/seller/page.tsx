import { Suspense } from "react";
import type { Metadata } from "next";
import { VendorDashboardView } from "@/components/vendor/vendor-dashboard-view";
import { LegacyTabRedirect } from "@/components/vendor/legacy-tab-redirect";

export const metadata: Metadata = { title: "Dashboard" };

export default function SellerDashboardPage() {
  return (
    <>
      {/* useSearchParams needs a Suspense boundary to keep the rest of the page static. */}
      <Suspense fallback={null}>
        <LegacyTabRedirect />
      </Suspense>
      <VendorDashboardView />
    </>
  );
}
