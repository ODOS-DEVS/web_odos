import type { CSSProperties } from "react";
import type { Product, Store } from "@/types/catalog";
import { cn } from "@/libs/cn";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  stores,
  columns = 4,
  className,
}: {
  products: Product[];
  /** id → Store, used to label each card with its vendor. */
  stores?: Map<string, Store>;
  /** Max columns at `lg`. Use 3 next to a sidebar. */
  columns?: 3 | 4;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <li
          key={product.id}
          className="rise-in"
          // Short stagger, capped so long lists never feel slow.
          style={{ "--i": Math.min(index, 8) } as CSSProperties}
        >
          <ProductCard
            product={product}
            storeName={product.storeId ? stores?.get(product.storeId)?.name : undefined}
            priority={index < 4}
          />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <ul
      className={cn("grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4", className)}
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="space-y-3">
          <div className="aspect-square animate-pulse rounded-2xl bg-surface-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-surface-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-surface-muted" />
        </li>
      ))}
    </ul>
  );
}
