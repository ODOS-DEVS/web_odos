import type { CSSProperties } from "react";
import type { Product, Store } from "@/types/catalog";
import { cn } from "@/libs/cn";
import { CardSkeleton } from "@/components/ui/card-skeleton";
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
        "no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-1",
        "sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 sm:overflow-visible sm:px-0 sm:pb-0",
        columns === 4 && "lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <li
          key={product.id}
          className="rise-in w-[84%] shrink-0 snap-start sm:w-auto sm:shrink"
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
      className={cn(
        "no-scrollbar -mx-4 flex gap-4 overflow-hidden px-5",
        "sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 sm:px-0 lg:grid-cols-4",
        className,
      )}
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="w-[84%] shrink-0 sm:w-auto sm:shrink">
          <CardSkeleton />
        </li>
      ))}
    </ul>
  );
}
