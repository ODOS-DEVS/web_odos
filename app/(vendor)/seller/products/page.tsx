import type { Metadata } from "next";
import { VendorProductsView } from "@/components/vendor/products/vendor-products-view";

export const metadata: Metadata = { title: "Products" };

export default function SellerProductsPage() {
  return <VendorProductsView />;
}
