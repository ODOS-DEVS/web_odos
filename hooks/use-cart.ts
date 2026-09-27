"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types/cart";
import type { Product } from "@/types/catalog";
import { MAX_LINE_QUANTITY, cartCount, cartSubtotal, lineKey } from "@/libs/cart";
import { useMounted } from "./use-mounted";

type AddInput = { product: Product; quantity?: number; size?: string | null; color?: string | null };

type CartState = {
  lines: CartLine[];
  add: (input: AddInput) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  restore: (line: CartLine) => void;
  clear: () => void;
};

const clamp = (n: number, max = MAX_LINE_QUANTITY) => Math.min(Math.max(n, 0), max);

// The cart lives in the browser (guests can shop) and is sent to the API when the order is placed.
const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: ({ product, quantity = 1, size = null, color = null }) =>
        set((state) => {
          const key = lineKey(product.id, size, color);
          const cap = Math.min(product.stock || MAX_LINE_QUANTITY, MAX_LINE_QUANTITY);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return { lines: state.lines.map((l) => (l.key === key ? { ...l, quantity: clamp(l.quantity + quantity, cap) } : l)) };
          }
          const line: CartLine = {
            key,
            productId: product.id,
            storeId: product.storeId,
            name: product.name,
            price: product.price,
            imageUrl: product.images[0] ?? null,
            quantity: clamp(quantity, cap),
            size,
            color,
            stock: product.stock,
          };
          return { lines: [...state.lines, line] };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity < 1
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, quantity: clamp(quantity, Math.min(l.stock || MAX_LINE_QUANTITY, MAX_LINE_QUANTITY)) } : l)),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      restore: (line) => set((state) => (state.lines.some((l) => l.key === line.key) ? state : { lines: [...state.lines, line] })),
      clear: () => set({ lines: [] }),
    }),
    // v2: lines now carry a product snapshot; the old shape (ids only) is intentionally abandoned.
    { name: "odos-cart-v2", partialize: (state) => ({ lines: state.lines }) },
  ),
);

/**
 * The shopper's cart. `ready` is false until the client has mounted (localStorage is unknown on the
 * server), so callers should render a skeleton rather than an empty cart.
 */
export function useCart() {
  const ready = useMounted();
  const stored = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const restore = useCartStore((s) => s.restore);
  const clear = useCartStore((s) => s.clear);

  const lines = useMemo(() => (ready ? stored : []), [ready, stored]);
  const count = useMemo(() => cartCount(lines), [lines]);
  const subtotal = useMemo(() => cartSubtotal(lines), [lines]);

  return { ready, lines, count, subtotal, add, setQuantity, remove, restore, clear };
}
