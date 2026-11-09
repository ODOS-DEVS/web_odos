"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SavedVoucher } from "@/types/voucher";

export type { SavedVoucher };
import { queryKeys, voucherQueries } from "@/services/queries";
import { vouchersService } from "@/services/vouchers.service";
import { useMounted } from "./use-mounted";

export type RedeemResult = "ok" | "already-redeemed" | "invalid";

/**
 * Connected directly to GET /vouchers/mine with React Query caching and live mutations.
 * Strictly presents genuine backend vouchers.
 */
export function useSavedVouchers() {
  const ready = useMounted();
  const queryClient = useQueryClient();

  const query = useQuery({
    ...voucherQueries.mine(),
    enabled: ready,
    retry: 1,
  });

  const redeemMutation = useMutation({
    mutationFn: async (code: string): Promise<RedeemResult> => {
      const key = code.trim().toUpperCase();
      if (!key) return "invalid";

      const current = query.data ?? [];
      if (current.some((v) => v.code.toUpperCase() === key)) {
        return "already-redeemed";
      }

      try {
        await vouchersService.redeemCode(key);
        return "ok";
      } catch {
        return "invalid";
      }
    },
    onSuccess: (result) => {
      if (result === "ok") {
        queryClient.invalidateQueries({ queryKey: queryKeys.myVouchers });
      }
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (voucherId: string) => {
      return await vouchersService.claim(voucherId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myVouchers });
    },
  });

  const vouchers = query.data ?? [];

  return {
    ready,
    isLoading: query.isLoading,
    isError: query.isError,
    vouchers,
    claim: (voucherId: string) => claimMutation.mutate(voucherId),
    redeem: (code: string) => redeemMutation.mutate(code),
    redeemAsync: (code: string) => redeemMutation.mutateAsync(code),
    isRedeeming: redeemMutation.isPending,
  };
}
