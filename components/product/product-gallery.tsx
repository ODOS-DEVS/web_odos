"use client";

import { useState } from "react";
import type { Product } from "@/types/catalog";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";

export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const images = product.images.length ? product.images : [null];
  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:items-start">
      <Media
        // Re-mount per image so the entrance animation replays on change.
        key={current ?? "none"}
        src={current}
        alt={product.name}
        name={product.name}
        priority
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="rise-in aspect-square w-full min-w-0 rounded-3xl lg:flex-1"
      />
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible" role="group" aria-label="Product images">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
              className={cn(
                "press shrink-0 overflow-hidden rounded-xl border-2",
                index === active ? "border-foreground" : "border-transparent hover:border-line",
              )}
            >
              <Media src={src} name={product.name} sizes="80px" className="size-16 sm:size-20" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
