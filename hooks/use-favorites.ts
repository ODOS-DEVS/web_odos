"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/catalog";
import { useMounted } from "./use-mounted";

export type FavoriteItem = {
  productId: string;
  storeId: string | null;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  savedAt: string;
};

type FavoritesState = {
  items: FavoriteItem[];
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

// Favourites live in the browser only — there's no wishlist endpoint wired up yet.
const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (product) =>
        set((state) => {
          const exists = state.items.some((item) => item.productId === product.id);
          if (exists) return { items: state.items.filter((item) => item.productId !== product.id) };
          const item: FavoriteItem = {
            productId: product.id,
            storeId: product.storeId,
            name: product.name,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            imageUrl: product.images[0] ?? null,
            savedAt: new Date().toISOString(),
          };
          return { items: [item, ...state.items] };
        }),
      remove: (productId) => set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "odos-favorites-v1" },
  ),
);

/** The shopper's saved products. `ready` is false until the client has mounted. */
export function useFavorites() {
  const ready = useMounted();
  const stored = useFavoritesStore((s) => s.items);
  const toggle = useFavoritesStore((s) => s.toggle);
  const remove = useFavoritesStore((s) => s.remove);
  const clear = useFavoritesStore((s) => s.clear);

  const items = useMemo(() => (ready ? stored : []), [ready, stored]);
  const ids = useMemo(() => new Set(items.map((item) => item.productId)), [items]);

  return { ready, items, count: items.length, ids, toggle, remove, clear };
}

export function useIsFavorite(productId: string) {
  const ready = useMounted();
  const saved = useFavoritesStore((s) => s.items.some((item) => item.productId === productId));
  return ready && saved;
}
