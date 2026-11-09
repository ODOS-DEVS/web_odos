"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorService, type VendorApplicationInput } from "@/services/vendor.service";
import { queryKeys, vendorQueries } from "@/services/queries";
import { useSession } from "./use-auth";

/** The shopper's vendor application, if they have filed one. */
export function useMyVendorApplication() {
  const session = useSession();
  return useQuery({ ...vendorQueries.myApplication(), enabled: Boolean(session) });
}

export function useApplyAsVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorApplicationInput) => vendorService.apply(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myVendorApplication }),
  });
}
