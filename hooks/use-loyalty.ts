"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loyaltyQueries, queryKeys } from "@/services/queries";
import { loyaltyService } from "@/services/loyalty.service";
import type { LoyaltyAccountRead, LoyaltyHistoryEntryRead } from "@/types/api";
import { useSession } from "./use-auth";
import { useMounted } from "./use-mounted";

const EMPTY_ACCOUNT: LoyaltyAccountRead = {
  points_balance: 0,
  lifetime_points: 0,
  tier_name: "Member",
  tier_multiplier: 1,
  point_cedi_value: 0.1,
  next_tier_name: "Silver",
  points_to_next_tier: 100,
};

export function useLoyalty() {
  const ready = useMounted();
  const session = useSession();
  const queryClient = useQueryClient();

  const accountQuery = useQuery({
    ...loyaltyQueries.account(),
    enabled: ready && Boolean(session),
    retry: 1,
  });

  const historyQuery = useQuery({
    ...loyaltyQueries.history(),
    enabled: ready && Boolean(session),
    retry: 1,
  });

  const redeemMutation = useMutation({
    mutationFn: async (points: number) => {
      return await loyaltyService.redeem({ points });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyAccount });
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyHistory });
    },
  });

  const account: LoyaltyAccountRead = accountQuery.data ?? EMPTY_ACCOUNT;

  const history: LoyaltyHistoryEntryRead[] = useMemo(() => {
    const raw = historyQuery.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.history)) return obj.history as LoyaltyHistoryEntryRead[];
      if (Array.isArray(obj.items)) return obj.items as LoyaltyHistoryEntryRead[];
      if (Array.isArray(obj.data)) return obj.data as LoyaltyHistoryEntryRead[];
      if (Array.isArray(obj.results)) return obj.results as LoyaltyHistoryEntryRead[];
      if (Array.isArray(obj.entries)) return obj.entries as LoyaltyHistoryEntryRead[];
    }
    return [];
  }, [historyQuery.data]);

  return {
    ready,
    isLoading: accountQuery.isLoading || historyQuery.isLoading,
    isError: accountQuery.isError || historyQuery.isError,
    account,
    history,
    redeem: (points: number) => redeemMutation.mutate(points),
    redeemAsync: (points: number) => redeemMutation.mutateAsync(points),
    isRedeeming: redeemMutation.isPending,
  };
}

/** Admin only: award bonus points to a customer by user id. */
export function useAwardLoyaltyPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; points: number; reason: string }) => loyaltyService.awardBonus(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["loyalty"] }),
  });
}
