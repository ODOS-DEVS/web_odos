"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMounted } from "./use-mounted";

export type WalletTransaction = {
  id: string;
  type: "topup";
  amount: number;
  methodLabel: string;
  createdAt: string;
};

type WalletState = {
  balance: number;
  transactions: WalletTransaction[];
  topUp: (amount: number, methodLabel: string) => void;
};

// There's no wallet endpoint wired up yet, so the balance lives in the browser like cart/favorites.
const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      balance: 600,
      transactions: [],
      topUp: (amount, methodLabel) =>
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

/** The shopper's ODOS Wallet balance and top-up history. `ready` is false until the client has mounted. */
export function useWallet() {
  const ready = useMounted();
  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);
  const topUp = useWalletStore((s) => s.topUp);

  return { ready, balance: ready ? balance : 0, transactions: useMemo(() => (ready ? transactions : []), [ready, transactions]), topUp };
}
