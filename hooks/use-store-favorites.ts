"use client";

import type { Store } from "@/types/catalog";
import { createFavoritesStore } from "./create-favorites-store";

export type FavoriteStore = {
  storeId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  savedAt: string;
};

const { useFavorites: useStoreFavorites, useIsFavorite: useIsStoreFavorite } = createFavoritesStore<
  Store,
  FavoriteStore
>({
  name: "odos-store-favorites-v1",
  getId: (item) => item.storeId,
  toItem: (store) => ({
    storeId: store.id,
    name: store.name,
    slug: store.slug,
    logoUrl: store.logoUrl ?? null,
    savedAt: new Date().toISOString(),
  }),
});

export { useStoreFavorites, useIsStoreFavorite };
