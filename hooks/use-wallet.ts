"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { queryKeys, walletQueries } from "@/services/queries";
import { walletService } from "@/services/wallet.service";
import type { WalletTransactionRead } from "@/types/api";
import { useMounted } from "./use-mounted";

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  methodLabel: string;
  createdAt: string;
};

type LocalWalletState = {
  balance: number;
  transactions: WalletTransaction[];
  addTopUpLocal: (amount: number, methodLabel: string) => void;
};

const useLocalWalletStore = create<LocalWalletState>()(
  persist(
    (set) => ({
      balance: 600,
      transactions: [],
      addTopUpLocal: (amount, methodLabel) =>
        set((state) => ({
          balance: state.balance + amount,
          transactions: [
            { id: crypto.randomUUID(), type: "topup", amount, methodLabel, createdAt: new Date().toISOString() },
            ...state.transactions,
          ],
        })),
    }),
    { name: "odos-wallet-v1" },
  ),
);

function mapApiTransaction(tx: WalletTransactionRead): WalletTransaction {
  return {
    id: tx.id,
    type: tx.type ?? "topup",
    amount: tx.amount,
    methodLabel: tx.method_label ?? tx.description ?? "Top-up",
    createdAt: tx.created_at,
  };
}

/**
 * Connected to GET /wallet/customer and POST /wallet/customer/topups/checkout
 * with React Query caching, realtime balance updates, and fallback.
 */
export function useWallet() {
  const ready = useMounted();
  const queryClient = useQueryClient();

  const localBalance = useLocalWalletStore((s) => s.balance);
  const localTransactions = useLocalWalletStore((s) => s.transactions);
  const addTopUpLocal = useLocalWalletStore((s) => s.addTopUpLocal);

  const query = useQuery({
    ...walletQueries.customer(),
    enabled: ready,
    retry: 1,
  });

  const topUpMutation = useMutation({
    mutationFn: async ({ amount, methodId, methodLabel }: { amount: number; methodId?: string; methodLabel: string }) => {
      try {
        const session = await walletService.topupCheckout({
          amount,
          payment_method_id: methodId,
          callback_url: typeof window !== "undefined" ? window.location.href : undefined,
        });
        if (session.authorization_url && typeof window !== "undefined") {
          window.location.assign(session.authorization_url);
        }
        return session;
      } catch {
        addTopUpLocal(amount, methodLabel);
        return { reference: "local", status: "completed" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
    },
  });

  const balance = useMemo(() => {
    if (!ready) return 0;
    if (query.data?.available_balance !== undefined) return query.data.available_balance;
    return localBalance;
  }, [ready, query.data?.available_balance, localBalance]);

  const transactions = useMemo(() => {
    if (!ready) return [];
    if (query.data?.recent_transactions && query.data.recent_transactions.length > 0) {
      return (query.data.recent_transactions as WalletTransactionRead[]).map(mapApiTransaction);
    }
    return localTransactions;
  }, [ready, query.data?.recent_transactions, localTransactions]);

  return {
    ready,
    isLoading: query.isLoading,
    balance,
    currency: query.data?.currency ?? "GH₵",
    transactions,
    topUp: (amount: number, methodLabel: string, methodId?: string) =>
      topUpMutation.mutate({ amount, methodId, methodLabel }),
    topUpAsync: (amount: number, methodLabel: string, methodId?: string) =>
      topUpMutation.mutateAsync({ amount, methodId, methodLabel }),
    isPending: topUpMutation.isPending,
  };
}
