"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMounted } from "./use-mounted";

/**
 * Builds a persisted "favorites" zustand store for any entity type — `use-favorites.ts` (products) and
 * `use-store-favorites.ts` (stores) are both thin wrappers around this, differing only in what they
 * store and how they read an item's id.
 */
export function createFavoritesStore<TEntity, TItem>({
  name,
  toItem,
  getId,
}: {
  /** localStorage key — there's no wishlist endpoint wired up yet, so favourites live in the browser only. */
  name: string;
  /** Builds the stored item from the entity being toggled. */
  toItem: (entity: TEntity) => TItem;
  /** The stored item's unique id, used for toggling and dedup. */
  getId: (item: TItem) => string;
}) {
  type State = {
    items: TItem[];
    toggle: (entity: TEntity) => void;
    remove: (id: string) => void;
    clear: () => void;
  };

  const useStore = create<State>()(
    persist(
      (set) => ({
        items: [],
        toggle: (entity) =>
          set((state) => {
            const id = getId(toItem(entity));
            const exists = state.items.some((item) => getId(item) === id);
            if (exists) return { items: state.items.filter((item) => getId(item) !== id) };
            return { items: [toItem(entity), ...state.items] };
          }),
        remove: (id) => set((state) => ({ items: state.items.filter((item) => getId(item) !== id) })),
        clear: () => set({ items: [] }),
      }),
      { name },
    ),
  );

  function useFavorites() {
    const ready = useMounted();
    const stored = useStore((s) => s.items);
    const toggle = useStore((s) => s.toggle);
    const remove = useStore((s) => s.remove);
    const clear = useStore((s) => s.clear);

    const items = useMemo(() => (ready ? stored : []), [ready, stored]);
    const ids = useMemo(() => new Set(items.map(getId)), [items]);

    return { ready, items, count: items.length, ids, toggle, remove, clear };
  }

  function useIsFavorite(id: string) {
    const ready = useMounted();
    const saved = useStore((s) => s.items.some((item) => getId(item) === id));
    return ready && saved;
  }

  return { useFavorites, useIsFavorite };
}
