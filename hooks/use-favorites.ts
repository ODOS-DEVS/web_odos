"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys, wishlistQueries } from "@/services/queries";
import { wishlistService } from "@/services/wishlist.service";
import type { FavoriteItem } from "@/types/account";
import type { Product } from "@/types/catalog";
import { createFavoritesStore } from "./create-favorites-store";
import { useSession } from "./use-auth";

export type { FavoriteItem };

/**
 * Guests get a browser-local wishlist so saving works before signing up; signed-in shoppers get the
 * real `/wishlist`, which is the same list their phone sees. Both are exposed through one hook so
 * callers never care which is in play.
 */
const { useFavorites: useLocalFavorites, useIsFavorite: useIsLocalFavorite } = createFavoritesStore<Product, FavoriteItem>({
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

export function useFavorites() {
  const session = useSession();
  const local = useLocalFavorites();
  const queryClient = useQueryClient();

  const query = useQuery({ ...wishlistQueries.list(), enabled: Boolean(session) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });

  const add = useMutation({ mutationFn: (product: Product) => wishlistService.add(product), onSuccess: invalidate });
  const drop = useMutation({ mutationFn: (productId: string) => wishlistService.remove(productId), onSuccess: invalidate });

  const items = useMemo(() => (session ? (query.data ?? []) : local.items), [session, query.data, local.items]);
  const ids = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  if (!session) return local;

  return {
    ready: query.isSuccess,
    items,
    count: items.length,
    ids,
    toggle: (product: Product) => (ids.has(product.id) ? drop.mutate(product.id) : add.mutate(product)),
    remove: (productId: string) => drop.mutate(productId),
    // There is no bulk-delete endpoint, so clearing removes each item.
    clear: () => items.forEach((item) => drop.mutate(item.productId)),
  };
}

export function useIsFavorite(id: string) {
  const session = useSession();
  const isLocal = useIsLocalFavorite(id);
  const query = useQuery({ ...wishlistQueries.list(), enabled: Boolean(session) });

  if (!session) return isLocal;
  return (query.data ?? []).some((item) => item.productId === id);
}
