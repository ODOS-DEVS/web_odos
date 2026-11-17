import type { Metadata } from "next";
import { CampaignsView } from "@/components/vendor/store/campaigns-view";

export const metadata: Metadata = { title: "Campaigns" };

export default function SellerCampaignsPage() {
  return <CampaignsView />;
}
