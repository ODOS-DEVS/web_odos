import type { Metadata } from "next";
import { VendorStockTab } from "@/components/vendor/vendor-stock-tab";
import { PageHeader } from "@/components/vendor/vendor-ui";

export const metadata: Metadata = { title: "Inventory" };

export default function SellerInventoryPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Inventory" description="Stock levels across your catalogue, and the movements behind them." />
      <VendorStockTab />
    </div>
  );
}
