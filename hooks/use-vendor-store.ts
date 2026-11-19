"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorAnalyticsService, vendorStoreService } from "@/services/vendor-store.service";
import { queryKeys } from "@/services/queries";
import { useSession } from "./use-auth";

const keys = {
  profile: ["vendor", "store", "profile"] as const,
  delivery: ["vendor", "delivery-settings"] as const,
  sections: ["vendor", "store", "sections"] as const,
  nominations: ["vendor", "flash-nominations"] as const,
  campaigns: ["vendor", "open-campaigns"] as const,
  optIns: ["vendor", "campaign-opt-ins"] as const,
};

const useGate = () => Boolean(useSession());

/* ---------- Store profile ---------- */

export function useVendorStoreProfile() {
  return useQuery({ queryKey: keys.profile, queryFn: () => vendorStoreService.profile(), enabled: useGate() });
}

export function useSaveVendorStoreProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorStoreService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.profile });
      // The shell header and the public storefront both read the store record.
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorStore });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

/* ---------- Delivery ---------- */

export function useVendorDeliverySettings() {
  return useQuery({ queryKey: keys.delivery, queryFn: () => vendorStoreService.deliverySettings(), enabled: useGate() });
}

export function useSaveVendorDeliverySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorStoreService.updateDeliverySettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.delivery }),
  });
}

/* ---------- Storefront sections ---------- */

export function useVendorStoreSections() {
  return useQuery({ queryKey: keys.sections, queryFn: () => vendorStoreService.sections(), enabled: useGate() });
}

function useSectionInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.sections });
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };
}

export function useCreateStoreSection() {
  const invalidate = useSectionInvalidation();
  return useMutation({
    mutationFn: (input: { title: string; description?: string | null }) =>
      vendorStoreService.createSection(input),
    onSuccess: invalidate,
  });
}

export function useUpdateStoreSection() {
  const invalidate = useSectionInvalidation();
  return useMutation({
    mutationFn: ({
      id,
      ...changes
    }: { id: string; title?: string; description?: string | null; isActive?: boolean }) =>
      vendorStoreService.updateSection(id, changes),
    onSuccess: invalidate,
  });
}

export function useSectionProducts(sectionId: string | null) {
  return useQuery({
    queryKey: [...keys.sections, sectionId, "products"] as const,
    queryFn: () => vendorStoreService.sectionProducts(sectionId ?? ""),
    enabled: useGate() && Boolean(sectionId),
  });
}

export function useSetSectionProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, productIds }: { sectionId: string; productIds: string[] }) =>
      vendorStoreService.setSectionProducts(sectionId, productIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.sections }),
  });
}

export function useUploadSectionCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, file }: { sectionId: string; file: File }) =>
      vendorStoreService.uploadSectionCover(sectionId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.sections }),
  });
}

export function useDeleteStoreSection() {
  const invalidate = useSectionInvalidation();
  return useMutation({ mutationFn: (id: string) => vendorStoreService.deleteSection(id), onSuccess: invalidate });
}

export function useReorderStoreSections() {
  const invalidate = useSectionInvalidation();
  return useMutation({ mutationFn: (ids: string[]) => vendorStoreService.reorderSections(ids), onSuccess: invalidate });
}

/* ---------- Flash sales and campaigns ---------- */

export function useVendorFlashNominations() {
  return useQuery({ queryKey: keys.nominations, queryFn: () => vendorStoreService.flashNominations(), enabled: useGate() });
}

export function useNominateForFlashSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorStoreService.nominateForFlashSale,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.nominations }),
  });
}

export function useOpenCampaigns() {
  return useQuery({ queryKey: keys.campaigns, queryFn: () => vendorStoreService.openCampaigns(), enabled: useGate() });
}

export function useCampaignOptIns() {
  return useQuery({ queryKey: keys.optIns, queryFn: () => vendorStoreService.campaignOptIns(), enabled: useGate() });
}

export function useCampaignWorkspace(slug: string) {
  return useQuery({
    queryKey: [...keys.campaigns, "workspace", slug] as const,
    queryFn: () => vendorStoreService.campaignWorkspace(slug),
    enabled: useGate() && Boolean(slug),
  });
}

export function useSubmitCampaignProducts(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: { productId: string; proposedPrice?: number | null; vendorNote?: string | null }[]) =>
      vendorStoreService.submitCampaignProducts(slug, items),
    onSuccess: () => {
      // The workspace holds the submission history this page renders, and the opt-in list
      // feeds the campaigns overview; both are stale the moment a nomination lands.
      queryClient.invalidateQueries({ queryKey: [...keys.campaigns, "workspace", slug] });
      queryClient.invalidateQueries({ queryKey: keys.optIns });
    },
  });
}

export function useOptInToCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, productId }: { campaignId: string; productId: string }) =>
      vendorStoreService.optInToCampaign(campaignId, productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.optIns }),
  });
}

/* ---------- Promotion analytics ---------- */

export function useVendorPromoOverview(days = 30) {
  return useQuery({
    queryKey: ["vendor", "promo-overview", days] as const,
    queryFn: () => vendorAnalyticsService.promoOverview(days),
    enabled: useGate(),
  });
}
