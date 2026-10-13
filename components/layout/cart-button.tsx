"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="press relative grid size-9 place-items-center rounded-full hover:bg-surface-muted min-[320px]:size-10"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
    >
      <ShoppingBag className="size-4.5 min-[320px]:size-5" aria-hidden />
      {count > 0 && (
        <span className="absolute top-0 right-0 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] leading-4 font-semibold text-accent-foreground tabular-nums min-[320px]:-top-0.5 min-[320px]:-right-0.5 min-[320px]:min-w-5 min-[320px]:text-[11px] min-[320px]:leading-5">
          {count}
        </span>
      )}
    </Link>
  );
}
