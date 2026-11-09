"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorCampaignsService, type VendorCampaign, type VendorCampaignInput } from "@/services/vendor-campaigns.service";
import { useSession } from "./use-auth";

const KEY = ["vendor", "campaigns"] as const;

export function useVendorCampaigns() {
  const session = useSession();
  return useQuery({ queryKey: KEY, queryFn: () => vendorCampaignsService.list(), enabled: Boolean(session) });
}

export function useVendorCampaign(id: string | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => vendorCampaignsService.get(id!),
    enabled: Boolean(id),
  });
}

export function useSaveVendorCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: VendorCampaignInput }) =>
      id ? vendorCampaignsService.update(id, input) : vendorCampaignsService.create(input),
    onSuccess: (campaign) => {
      if (campaign.id) {
        queryClient.setQueryData<VendorCampaign[]>(KEY, (prev = []) =>
          prev.some((c) => c.id === campaign.id) ? prev.map((c) => (c.id === campaign.id ? campaign : c)) : [campaign, ...prev],
        );
      }
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}
