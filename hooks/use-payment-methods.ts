"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Logo } from "@/components/checkout/logo-badge";
import { useMounted } from "./use-mounted";

export type SavedPaymentMethod = {
  id: string;
  kind: "momo" | "card";
  label: string;
  subtitle: string;
  logo: Logo;
  isDefault?: boolean;
};

const SEED: SavedPaymentMethod[] = [
  {
    id: "mtn",
    kind: "momo",
    label: "MTN MoMo",
    subtitle: "MTN Mobile Money · 024 897 4005",
    isDefault: true,
    logo: { kind: "image", src: "/payment-logos/mtn-official.png", alt: "MTN" },
  },
  {
    id: "telecel",
    kind: "momo",
    label: "Telecel Cash",
    subtitle: "Telecel Cash · 020 123 4567",
    logo: { kind: "image", src: "/payment-logos/telecel-icon.png", alt: "Telecel" },
  },
  {
    id: "card",
    kind: "card",
    label: "**** 8451",
    subtitle: "Mastercard Debit/Credit · 8451 · 01/33",
    logo: { kind: "image", src: "/payment-logos/mastercard-official.svg", alt: "Mastercard" },
  },
];

type PaymentMethodsState = {
  methods: SavedPaymentMethod[];
  add: (method: Omit<SavedPaymentMethod, "id">) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
};

const usePaymentMethodsStore = create<PaymentMethodsState>()(
  persist(
    (set) => ({
      methods: SEED,
      add: (method) =>
        set((state) => ({
          methods: [...state.methods, { ...method, id: crypto.randomUUID() }],
        })),
      remove: (id) => set((state) => ({ methods: state.methods.filter((m) => m.id !== id) })),
      setDefault: (id) =>
        set((state) => ({
          methods: state.methods.map((m) => ({ ...m, isDefault: m.id === id })),
        })),
    }),
    { name: "odos-payment-methods-v3" },
  ),
);

/** The shopper's saved momo numbers and cards. `ready` is false until the client has mounted. */
export function usePaymentMethods() {
  const ready = useMounted();
  const stored = usePaymentMethodsStore((s) => s.methods);
  const add = usePaymentMethodsStore((s) => s.add);
  const remove = usePaymentMethodsStore((s) => s.remove);
  const setDefault = usePaymentMethodsStore((s) => s.setDefault);

  const methods = useMemo(() => (ready ? stored : []), [ready, stored]);

  return { ready, methods, add, remove, setDefault };
}
