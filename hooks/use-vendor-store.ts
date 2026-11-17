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
  return useMutation({ mutationFn: (title: string) => vendorStoreService.createSection(title), onSuccess: invalidate });
}

export function useUpdateStoreSection() {
  const invalidate = useSectionInvalidation();
  return useMutation({
    mutationFn: ({ id, ...changes }: { id: string; title?: string; isActive?: boolean }) =>
      vendorStoreService.updateSection(id, changes),
    onSuccess: invalidate,
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
