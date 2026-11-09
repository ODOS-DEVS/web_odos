"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys, walletQueries } from "@/services/queries";
import { walletService, type WalletTopUpInput } from "@/services/wallet.service";
import { useSession } from "./use-auth";

/** The shopper's ODOS Wallet. `ready` is false until the balance has actually arrived. */
export function useWallet() {
  const session = useSession();
  const query = useQuery({ ...walletQueries.detail(), enabled: Boolean(session) });

  return {
    ready: Boolean(session) && query.isSuccess,
    balance: query.data?.balance ?? 0,
    currency: query.data?.currency,
    transactions: query.data?.transactions ?? [],
    wallet: query.data,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Starts a wallet top-up. The caller redirects to `authorizationUrl`; the balance only changes once
 * the provider confirms the payment, so nothing is credited here.
 */
export function useTopUpWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WalletTopUpInput) => walletService.topUp(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet }),
  });
}
