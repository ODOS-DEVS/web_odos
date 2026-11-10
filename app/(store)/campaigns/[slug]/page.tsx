import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { CampaignView } from "@/components/campaign/campaign-view";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { ApiError } from "@/services/http";
import { catalogQueries } from "@/services/queries";
import type { CampaignDetail } from "@/types/catalog";

/** Shared with `generateMetadata` through the per-request query client, so this costs one fetch. */
async function loadCampaign(slug: string): Promise<CampaignDetail | null> {
  try {
    return await getServerQueryClient().fetchQuery(catalogQueries.campaign(slug));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/campaigns/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) return {};
  return {
    title: campaign.title,
    description: campaign.subtitle ?? campaign.description ?? undefined,
    openGraph: { images: campaign.bannerImageUrl ? [campaign.bannerImageUrl] : [] },
  };
}

export default async function CampaignPage({ params }: PageProps<"/campaigns/[slug]">) {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) notFound();

  const queryClient = getServerQueryClient();
  // The grid labels each product with its vendor.
  await prefetchAll(queryClient, catalogQueries.stores());

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <CampaignView slug={slug} />
    </HydrationBoundary>
  );
}
