import type { Metadata } from "next";
import { CampaignSubmitView } from "@/components/vendor/store/campaign-submit-view";

export const metadata: Metadata = { title: "Submit products" };

/**
 * Per-campaign submission page. The slug is the campaign's identity end to end: it is what the
 * invitation notification carries, what this route resolves, and what the API scopes the
 * workspace to — so two campaigns can never share a submission screen.
 */
export default async function SellerCampaignSubmitPage({
  params,
}: PageProps<"/seller/campaigns/[slug]/submit">) {
  const { slug } = await params;
  return <CampaignSubmitView slug={slug} />;
}
