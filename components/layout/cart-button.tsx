"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="press relative grid size-10 place-items-center rounded-full hover:bg-surface-muted"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] leading-5 font-semibold text-accent-foreground tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}
