"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys, voucherQueries } from "@/services/queries";
import { vouchersService } from "@/services/vouchers.service";
import { useSession } from "./use-auth";

/** Offers a single vendor is running. Public, so it loads for signed-out shoppers too. */
export const useStoreVouchers = (storeId: string | undefined) =>
  useQuery({ ...voucherQueries.forStore(storeId ?? ""), enabled: Boolean(storeId) });

/** Every public offer on the board — also how a typed code is resolved to a voucher id. */
export const usePromotions = () => useQuery(voucherQueries.promotions());

/** Claims a public offer into the shopper's wallet. */
export function useClaimVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (voucherId: string) => vouchersService.claim(voucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myVouchers });
      // A claimed offer comes back with `claimed: true`, so the store/board views need refreshing.
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      // The deals hub carries the same claimed flags on its promotions.
      queryClient.invalidateQueries({ queryKey: queryKeys.dealsHub });
    },
  });
}

export type RedeemResult = "ok" | "already-redeemed" | "invalid";

/**
 * The shopper's wallet of claimed vouchers, plus redeeming by typed code.
 *
 * There is no "claim by code" endpoint — claiming needs a voucher id — so a typed code is matched
 * against the public promotions list first, and the id that comes back is what gets claimed.
 */
export function useSavedVouchers() {
  const session = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({ ...voucherQueries.mine(), enabled: Boolean(session) });

  const redeem = useMutation<RedeemResult, unknown, string>({
    mutationFn: async (rawCode) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) return "invalid";

      const wallet = query.data ?? [];
      if (wallet.some((v) => v.code.toUpperCase() === code)) return "already-redeemed";

      const promotions = await queryClient.fetchQuery(voucherQueries.promotions());
      const match = promotions.find((v) => v.code.toUpperCase() === code);
      if (!match) return "invalid";
      if (match.claimed) return "already-redeemed";

      await vouchersService.claim(match.id);
      return "ok";
    },
    onSuccess: (result) => {
      if (result === "ok") queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });

  return {
    /** False while the wallet is still loading, or when nobody is signed in. */
    ready: Boolean(session) && !query.isPending,
    vouchers: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    redeem,
  };
}
