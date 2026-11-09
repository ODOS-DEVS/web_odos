"use client";

import { useEffect, useRef, useState } from "react";
import { lineKey } from "@/libs/cart";
import { cartService, type ServerCartItem } from "@/services/cart.service";
import { catalogService } from "@/services/catalog.service";
import { wishlistService } from "@/services/wishlist.service";
import type { CartLine } from "@/types/cart";
import type { Product } from "@/types/catalog";
import { useSession } from "./use-auth";
import { useCartStore } from "./use-cart";
import { useFavoritesStore } from "./use-favorites";

/** Wait this long after the last change before pushing, so quantity taps don't each fire a request. */
const PUSH_DELAY_MS = 600;

const totalsByProduct = (lines: CartLine[]) => {
  const totals = new Map<string, number>();
  for (const line of lines) totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  return totals;
};

/** A server cart row back into a browser cart line, enriched with the live product when we can fetch it. */
function toLine(item: ServerCartItem, product: Product | null): CartLine {
  return {
    key: lineKey(item.productId, null, null),
    productId: item.productId,
    storeId: product?.storeId ?? null,
    name: product?.name ?? item.name,
    price: product?.price ?? item.price,
    imageUrl: product?.images[0] ?? item.imageUrl,
    quantity: item.quantity,
    size: null,
    color: null,
    stock: product?.stock ?? 0,
  };
}

/**
 * Keeps the browser cart and the account cart (`/cart`) in step while signed in.
 * - On login: items only on the account are pulled into the browser cart (so nothing is lost either way).
 * - After that: every change is pushed as per-product quantities (the account cart has no size/colour).
 * Guests are unaffected: their cart stays in the browser only.
 */
export function useCartSync() {
  const userId = useSession()?.user.id ?? null;
  const lines = useCartStore((s) => s.lines);
  const [mergedFor, setMergedFor] = useState<string | null>(null);
  /** productId → quantity as the server last confirmed it. */
  const server = useRef(new Map<string, number>());

  useEffect(() => {
    if (!userId || mergedFor === userId) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await cartService.list();
        const localIds = new Set(useCartStore.getState().lines.map((l) => l.productId));
        const missing = items.filter((item) => !localIds.has(item.productId));
        const restored = await Promise.all(
          missing.map(async (item) => toLine(item, await catalogService.product(item.productId).catch(() => null))),
        );
        if (cancelled) return;
        for (const line of restored) useCartStore.getState().restore(line);
        server.current = new Map(items.map((item) => [item.productId, item.quantity]));
        setMergedFor(userId);
      } catch {
        // Keep the browser cart as is; the merge is retried on the next login or reload.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, mergedFor]);

  useEffect(() => {
    if (!userId || mergedFor !== userId) return;
    const timer = setTimeout(() => {
      const want = totalsByProduct(lines);
      const have = server.current;
      const ops: Promise<unknown>[] = [];
      for (const [productId, quantity] of want) {
        const current = have.get(productId);
        if (current === quantity) continue;
        const line = lines.find((l) => l.productId === productId)!;
        const request =
          current === undefined
            ? cartService.add({ productId, name: line.name, price: line.price, imageUrl: line.imageUrl, quantity })
            : cartService.setQuantity(productId, quantity);
        ops.push(request.then(() => have.set(productId, quantity)));
      }
      for (const productId of [...have.keys()]) {
        if (!want.has(productId)) ops.push(cartService.remove(productId).then(() => have.delete(productId)));
      }
      // A failed push is retried on the next cart change; the browser cart stays the source of truth.
      void Promise.allSettled(ops);
    }, PUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [lines, userId, mergedFor]);

  // Logging out keeps the browser cart (now a guest cart) but forgets the account's state.
  useEffect(() => {
    if (!userId) {
      server.current = new Map();
      setMergedFor(null);
    }
  }, [userId]);
}

/**
 * Same idea for product favourites ↔ the account wishlist (`/wishlist`): merge on login, then push
 * each heart / un-heart. Store favourites have no endpoint and stay in the browser.
 */
export function useWishlistSync() {
  const userId = useSession()?.user.id ?? null;
  const items = useFavoritesStore((s) => s.items);
  const [mergedFor, setMergedFor] = useState<string | null>(null);
  const server = useRef(new Set<string>());

  useEffect(() => {
    if (!userId || mergedFor === userId) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await wishlistService.list();
        if (cancelled) return;
        const local = useFavoritesStore.getState().items;
        const localIds = new Set(local.map((item) => item.productId));
        const missing = remote.filter((item) => !localIds.has(item.productId));
        if (missing.length) useFavoritesStore.setState({ items: [...local, ...missing] });
        server.current = new Set(remote.map((item) => item.productId));
        setMergedFor(userId);
      } catch {
        // Keep the browser favourites; retried on the next login or reload.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, mergedFor]);

  useEffect(() => {
    if (!userId || mergedFor !== userId) return;
    const timer = setTimeout(() => {
      const want = new Set(items.map((item) => item.productId));
      const have = server.current;
      const ops: Promise<unknown>[] = [];
      for (const item of items) {
        if (!have.has(item.productId)) ops.push(wishlistService.add(item).then(() => have.add(item.productId)));
      }
      for (const productId of [...have]) {
        if (!want.has(productId)) ops.push(wishlistService.remove(productId).then(() => have.delete(productId)));
      }
      void Promise.allSettled(ops);
    }, PUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [items, userId, mergedFor]);

  useEffect(() => {
    if (!userId) {
      server.current = new Set();
      setMergedFor(null);
    }
  }, [userId]);
}
