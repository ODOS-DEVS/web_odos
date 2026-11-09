"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loyaltyService } from "@/services/loyalty.service";
import { loyaltyQueries, queryKeys } from "@/services/queries";
import { useSession } from "./use-auth";

/** The shopper's points, tier and benefits. */
export function useLoyalty() {
  const session = useSession();
  const account = useQuery({ ...loyaltyQueries.account(), enabled: Boolean(session) });
  const history = useQuery({ ...loyaltyQueries.history(), enabled: Boolean(session) });

  return { account, history };
}

/** Burns points for ODOS Wallet credit, so the wallet and the ledger both move. */
export function useRedeemPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (points: number) => loyaltyService.redeem(points),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.invalidateQueries({ queryKey: ["loyalty"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
    },
  });
}
