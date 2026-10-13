"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/catalog";
import { discountPercent } from "@/libs/format";
import { cn } from "@/libs/cn";
import { useFavorites, useIsFavorite } from "@/hooks/use-favorites";
import { Badge } from "@/components/ui/badge";
import { Media } from "@/components/ui/media";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { favoriteShareActions, SpeedDial, type SpeedDialAction } from "@/components/ui/speed-dial";
import { useAddToCart } from "./add-to-cart-button";

export function ProductCard({ product, storeName, priority }: { product: Product; storeName?: string; priority?: boolean }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;
  const images = product.images.length ? product.images : [null];
  const hasMultiple = images.length > 1;
  const [index, setIndex] = useState(0);

  const { toggle: toggleFavorite } = useFavorites();
  const saved = useIsFavorite(product.id);
  const addToCart = useAddToCart(product);

  // Arrows/dots sit above the card's stretched link (z-10) and preventDefault so stepping never navigates.
  const step = (delta: number) => (event: MouseEvent) => {
    event.preventDefault();
    setIndex((i) => (i + delta + images.length) % images.length);
  };

  const actions: SpeedDialAction[] = [
    ...(soldOut
      ? []
      : [
          {
            key: "cart",
            label: `Add ${product.name} to cart`,
            icon: <ShoppingBag className="size-4" aria-hidden />,
            onSelect: () => addToCart(1, { size: product.sizes[0] ?? null, color: product.colors[0] ?? null }),
          },
        ]),
    ...favoriteShareActions({
      name: product.name,
      href: `/products/${product.id}`,
      saved,
      onToggleFavorite: () => toggleFavorite(product),
    }),
  ];

  return (
    <article className="group relative flex flex-col">
      <div
        className="relative"
        onMouseLeave={() => setIndex(0)}
      >
        <Media
          key={index}
          src={images[index]}
          name={product.name}
          priority={priority}
          className="aspect-square rounded-2xl"
          imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {off > 0 && <Badge tone="accent">−{off}%</Badge>}
          {product.tags.includes("new") && <Badge tone="success">New</Badge>}
          {soldOut && <Badge tone="danger">Sold out</Badge>}
        </div>
        <SpeedDial actions={actions} className="absolute right-3 bottom-3" />

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={step(-1)}
              className="press absolute top-1/2 left-2 z-20 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 pointer-coarse:opacity-100"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={step(1)}
              className="press absolute top-1/2 right-2 z-20 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 pointer-coarse:opacity-100"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1" aria-hidden>
              {images.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-surface" : "w-1.5 bg-surface/60")} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        {storeName && <p className="truncate text-[11px] text-muted min-[360px]:text-xs">{storeName}</p>}
        <h3 className="text-[13px] leading-snug font-medium tracking-normal min-[360px]:text-sm">
          {/* Stretched link: the whole card is clickable without nesting the add button in an anchor. */}
          <Link
            href={`/products/${product.id}`}
            className="line-clamp-2 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline"
          >
            {product.name}
          </Link>
        </h3>
        {product.reviewCount > 0 && (
          <Rating value={product.rating} count={product.reviewCount} className="text-xs min-[360px]:text-sm" />
        )}
        <Price value={product.price} compareAt={product.compareAtPrice ?? undefined} className="mt-1" />
      </div>
    </article>
  );
}
