"use client";

import type { MouseEvent } from "react";
import { Heart } from "lucide-react";
import type { Product } from "@/types/catalog";
import { cn } from "@/libs/cn";
import { useFavorites, useIsFavorite } from "@/hooks/use-favorites";

export function FavoriteButton({ product, className }: { product: Product; className?: string }) {
  const { toggle } = useFavorites();
  const saved = useIsFavorite(product.id);

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    toggle(product);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from favorites` : `Save ${product.name} to favorites`}
      className={cn(
        "press z-10 grid size-9 place-items-center rounded-full bg-surface/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-danger",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-danger text-danger")} aria-hidden />
    </button>
  );
}
