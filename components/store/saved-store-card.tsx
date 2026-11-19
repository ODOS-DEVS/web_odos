"use client";

import Link from "next/link";
import { MapPin, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { VerifiedBadge } from "@/components/store/verified-badge";
import type { Store } from "@/types/catalog";

/** One saved shop, with everything needed to decide whether to go back to it. */
export function SavedStoreCard({
  store,
  onRemove,
  removing = false,
}: {
  store: Store;
  onRemove: () => void;
  removing?: boolean;
}) {
  const place = [store.city, store.region].filter(Boolean).join(", ");

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <Link href={`/stores/${store.slug}`} className="press flex min-w-0 items-start gap-3 p-4">
        <Media src={store.logoUrl} name={store.name} sizes="64px" className="size-16 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{store.name}</span>
            {store.isVerified && <VerifiedBadge size="sm" />}
          </span>
          {store.category && <span className="mt-0.5 block truncate text-xs text-muted">{store.category}</span>}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-current text-warning" aria-hidden />
              {store.rating > 0 ? store.rating.toFixed(1) : "New"}
            </span>
            {place && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{place}</span>
              </span>
            )}
          </span>
        </span>
      </Link>

      {store.description && (
        <p className="line-clamp-2 px-4 text-xs leading-5 text-muted">{store.description}</p>
      )}

      <div className="mt-auto flex items-center gap-2 p-4 pt-3">
        <ButtonLink href={`/stores/${store.slug}`} size="sm" variant="outline" className="flex-1">
          Visit store
        </ButtonLink>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={removing}
          aria-label={`Remove ${store.name} from saved stores`}
          onClick={onRemove}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}
