"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMounted } from "./use-mounted";

export type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  isDefault?: boolean;
};

const SEED: SavedAddress[] = [
  {
    id: "home",
    label: "Home",
    fullName: "Tricia Kanate",
    phone: "+233241112233",
    street: "18 Independence Ave",
    city: "Accra",
    region: "Greater Accra",
    isDefault: true,
  },
];

type AddressesState = {
  addresses: SavedAddress[];
  add: (address: Omit<SavedAddress, "id">) => void;
  update: (id: string, address: Omit<SavedAddress, "id">) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
};

const useAddressesStore = create<AddressesState>()(
  persist(
    (set) => ({
      addresses: SEED,
      add: (address) =>
        set((state) => {
          const isDefault = address.isDefault || state.addresses.length === 0;
          return {
            addresses: [
              ...(isDefault ? state.addresses.map((a) => ({ ...a, isDefault: false })) : state.addresses),
              { ...address, isDefault, id: crypto.randomUUID() },
            ],
          };
        }),
      update: (id, address) =>
        set((state) => ({
          addresses: state.addresses.map((a) => {
            if (a.id === id) return { ...address, id, isDefault: address.isDefault || a.isDefault };
            return address.isDefault ? { ...a, isDefault: false } : a;
          }),
        })),
      remove: (id) =>
        set((state) => {
          const removed = state.addresses.find((a) => a.id === id);
          const rest = state.addresses.filter((a) => a.id !== id);
          if (removed?.isDefault && rest.length > 0) rest[0] = { ...rest[0], isDefault: true };
          return { addresses: rest };
        }),
      setDefault: (id) =>
        set((state) => ({
          addresses: state.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        })),
    }),
    { name: "odos-addresses-v1" },
  ),
);

/** The shopper's saved delivery addresses. `ready` is false until the client has mounted. */
export function useAddresses() {
  const ready = useMounted();
  const stored = useAddressesStore((s) => s.addresses);
  const add = useAddressesStore((s) => s.add);
  const update = useAddressesStore((s) => s.update);
  const remove = useAddressesStore((s) => s.remove);
  const setDefault = useAddressesStore((s) => s.setDefault);

  const addresses = useMemo(() => (ready ? stored : []), [ready, stored]);

  return { ready, addresses, add, update, remove, setDefault };
}
