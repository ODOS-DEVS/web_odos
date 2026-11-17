import type { Metadata } from "next";
import { StoreSectionsView } from "@/components/vendor/store/sections-view";

export const metadata: Metadata = { title: "Storefront" };

export default function SellerSectionsPage() {
  return <StoreSectionsView />;
}
