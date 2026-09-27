"use client";

import { useMemo } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { groupLines } from "@/libs/cart";
import { mockStoreMap } from "@/mocks/catalog.mock";
import { mockDeliveryQuote } from "@/mocks/delivery.mock";
import { fakeQuery } from "@/mocks/query";
import { ButtonLink } from "@/components/ui/button";
import { CartGroup } from "./cart-group";
import { OrderSummary } from "./order-summary";

function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]" aria-busy="true" aria-label="Loading cart">
      <div className="space-y-5">
        {[0, 1].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-muted" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-surface-muted" />
    </div>
  );
}

export function CartView() {
  const { ready, lines, subtotal, count } = useCart();
  const stores = mockStoreMap();

  const groups = useMemo(() => groupLines(lines, stores), [lines, stores]);
  const quote = fakeQuery(
    mockDeliveryQuote({ subtotal, items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.price })) }),
  );

  if (!ready) return <CartSkeleton />;

  if (groups.length === 0) {
    return (
      <div className="grid place-items-center rounded-3xl border border-dashed border-line px-6 py-24 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-surface-muted">
          <ShoppingBag className="size-7 text-muted" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">Add items from any store. You can mix vendors and check out once.</p>
        <ButtonLink href="/products" className="mt-6" size="lg">
          Browse products
        </ButtonLink>
      </div>
    );
  }

  const shipping = quote.data?.shippingAmount ?? null;
  const packageFor = (storeId: string | null) => quote.data?.packages.find((p) => p.storeId === storeId);

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-5">
        {groups.map((group) => (
          <CartGroup key={group.storeId ?? "unknown"} group={group} pkg={packageFor(group.storeId)} />
        ))}
      </div>

      <OrderSummary
        totals={{ items: subtotal, delivery: shipping, total: subtotal + (shipping ?? 0), vendors: groups.length }}
        className="lg:sticky lg:top-40"
      >
        <ButtonLink href="/checkout" size="lg" variant="accent" className="w-full">
          Checkout · {count} {count === 1 ? "item" : "items"}
        </ButtonLink>
        <p className="mt-3 text-center text-xs text-muted">You pay once. Each vendor delivers their own package.</p>
      </OrderSummary>
    </div>
  );
}
