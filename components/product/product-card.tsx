"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types/catalog";
import { discountPercent } from "@/libs/format";
import { cn } from "@/libs/cn";
import { Badge } from "@/components/ui/badge";
import { Media } from "@/components/ui/media";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { QuickAddButton } from "./add-to-cart-button";
import { FavoriteButton } from "./favorite-button";

export function ProductCard({ product, storeName, priority }: { product: Product; storeName?: string; priority?: boolean }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;
  const images = product.images.length ? product.images : [null];
  const hasMultiple = images.length > 1;
  const [index, setIndex] = useState(0);

  // Arrows/dots sit above the card's stretched link (z-10) and preventDefault so stepping never navigates.
  const step = (delta: number) => (event: MouseEvent) => {
    event.preventDefault();
    setIndex((i) => (i + delta + images.length) % images.length);
  };

  return (
    <article className="group relative flex flex-col">
      <div
        className="relative overflow-hidden rounded-2xl"
        onMouseLeave={() => setIndex(0)}
      >
        <Media
          key={index}
          src={images[index]}
          name={product.name}
          priority={priority}
          className="aspect-square"
          imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {off > 0 && <Badge tone="accent">−{off}%</Badge>}
          {product.tags.includes("new") && <Badge tone="success">New</Badge>}
          {soldOut && <Badge tone="danger">Sold out</Badge>}
        </div>
        {!soldOut && <QuickAddButton product={product} className="absolute right-3 bottom-3" />}
        <FavoriteButton product={product} className="absolute top-3 right-3" />

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={step(-1)}
              className="press absolute top-1/2 left-2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 pointer-coarse:opacity-100"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={step(1)}
              className="press absolute top-1/2 right-2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 pointer-coarse:opacity-100"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1" aria-hidden>
              {images.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-surface" : "w-1.5 bg-surface/60")} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        {storeName && <p className="truncate text-xs text-muted">{storeName}</p>}
        <h3 className="text-sm leading-snug font-medium tracking-normal">
          {/* Stretched link: the whole card is clickable without nesting the add button in an anchor. */}
          <Link
            href={`/products/${product.id}`}
            className="line-clamp-2 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline"
          >
            {product.name}
          </Link>
        </h3>
        {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} />}
        <Price value={product.price} compareAt={product.compareAtPrice ?? undefined} className="mt-1" />
      </div>
    </article>
  );
}
