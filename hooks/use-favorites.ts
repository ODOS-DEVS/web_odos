"use client";

import type { Product } from "@/types/catalog";
import { createFavoritesStore } from "./create-favorites-store";

export type FavoriteItem = {
  productId: string;
  storeId: string | null;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  savedAt: string;
};

const { useFavorites, useIsFavorite } = createFavoritesStore<Product, FavoriteItem>({
  name: "odos-favorites-v1",
  getId: (item) => item.productId,
  toItem: (product) => ({
    productId: product.id,
    storeId: product.storeId,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    imageUrl: product.images[0] ?? null,
    savedAt: new Date().toISOString(),
  }),
});

export { useFavorites, useIsFavorite };
