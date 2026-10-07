"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SavedVoucher } from "@/types/voucher";
import { MOCK_REDEEMABLE_CODES, SEED_SAVED_VOUCHERS } from "@/mocks/voucher-wallet.mock";
import { useMounted } from "./use-mounted";

type RedeemResult = "ok" | "already-redeemed" | "invalid";

type SavedVouchersState = {
  vouchers: SavedVoucher[];
  save: (voucher: Omit<SavedVoucher, "id">) => void;
  redeem: (code: string) => RedeemResult;
};

// No vouchers endpoint wired up yet, so the shopper's wallet lives in the browser like favorites/wallet.
const useSavedVouchersStore = create<SavedVouchersState>()(
  persist(
    (set, get) => ({
      vouchers: SEED_SAVED_VOUCHERS,
      save: (voucher) => set({ vouchers: [{ ...voucher, id: crypto.randomUUID() }, ...get().vouchers] }),
      redeem: (code) => {
        const key = code.trim().toUpperCase();
        if (!key) return "invalid";
        if (get().vouchers.some((v) => v.code === key)) return "already-redeemed";
        const template = MOCK_REDEEMABLE_CODES[key];
        if (!template) return "invalid";
        set({ vouchers: [{ ...template, code: key, id: crypto.randomUUID() }, ...get().vouchers] });
        return "ok";
      },
    }),
    { name: "odos-saved-vouchers-v1" },
  ),
);

/** The shopper's saved/redeemed vouchers. `ready` is false until the client has mounted. */
export function useSavedVouchers() {
  const ready = useMounted();
  const stored = useSavedVouchersStore((s) => s.vouchers);
  const save = useSavedVouchersStore((s) => s.save);
  const redeem = useSavedVouchersStore((s) => s.redeem);

  const vouchers = useMemo(() => (ready ? stored : []), [ready, stored]);

  return { ready, vouchers, save, redeem };
}
