"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/cn";
import { useIsStoreFavorite, useStoreFavorites } from "@/hooks/use-store-favorites";
import type { Store } from "@/types/catalog";

/**
 * Follow a store.
 *
 * Saved in this browser only: the API has a wishlist for *products* but no follow endpoint for
 * stores, so there is nothing to sync to. The label says "Saved" rather than "Following" to
 * avoid implying the shopper will be notified about anything.
 */
export function FollowStoreButton({ store, className }: { store: Store; className?: string }) {
  const following = useIsStoreFavorite(store.id);
  const { toggle } = useStoreFavorites();

  return (
    <Button
      type="button"
      variant={following ? "primary" : "outline"}
      size="sm"
      aria-pressed={following}
      onClick={() => toggle(store)}
      className={cn(className)}
    >
      <Heart className={cn("size-4", following && "fill-current")} aria-hidden />
      {following ? "Saved" : "Save store"}
    </Button>
  );
}
