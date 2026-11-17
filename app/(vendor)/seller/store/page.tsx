import type { Metadata } from "next";
import { StoreProfileView } from "@/components/vendor/store/store-profile-view";

export const metadata: Metadata = { title: "Store profile" };

export default function SellerStorePage() {
  return <StoreProfileView />;
}
