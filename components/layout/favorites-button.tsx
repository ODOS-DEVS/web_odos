"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, ShoppingBag, Trash2, X } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { Media } from "@/components/ui/media";
import { Price } from "@/components/ui/price";
import { ButtonLink } from "@/components/ui/button";

/** Header trigger for a right-side drawer listing saved products. Owns its own open state. */
export function FavoritesButton() {
  const [open, setOpen] = useState(false);
  const { ready, items, count, remove, clear } = useFavorites();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press relative grid size-10 place-items-center rounded-full hover:bg-surface-muted"
        aria-label={ready && count > 0 ? `Favorites, ${count} items` : "Favorites"}
      >
        <Heart className="size-5" aria-hidden />
        {ready && count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] leading-5 font-semibold text-accent-foreground tabular-nums">
            {count}
          </span>
        )}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close favorites drawer"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="favorites-drawer-heading"
              className="slide-in-right absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 id="favorites-drawer-heading" className="text-lg font-semibold">
                  Favorites {count > 0 && <span className="text-muted">({count})</span>}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="press grid size-9 place-items-center rounded-full hover:bg-surface-muted"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                {items.length === 0 ? (
                  <div className="grid place-items-center py-16 text-center">
                    <Heart className="size-10 text-muted" aria-hidden />
                    <h3 className="mt-4 text-base font-semibold">No favorites yet</h3>
                    <p className="mt-1.5 max-w-50 text-sm text-muted">Tap the heart on any product to save it here.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li key={item.productId} className="flex gap-3">
                        <Link href={`/products/${item.productId}`} onClick={() => setOpen(false)} className="shrink-0">
                          <Media src={item.imageUrl} name={item.name} className="size-16 rounded-xl" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/products/${item.productId}`}
                            onClick={() => setOpen(false)}
                            className="line-clamp-2 text-sm font-medium hover:underline"
                          >
                            {item.name}
                          </Link>
                          <Price value={item.price} compareAt={item.compareAtPrice ?? undefined} className="mt-1" />
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.productId)}
                          aria-label={`Remove ${item.name} from favorites`}
                          className="press grid size-8 shrink-0 place-items-center self-start rounded-full text-muted hover:bg-surface-muted hover:text-danger"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-3 border-t border-line px-5 py-4">
                  <ButtonLink href="/products" variant="primary" size="lg" className="w-full" onClick={() => setOpen(false)}>
                    <ShoppingBag className="size-4" aria-hidden />
                    Keep shopping
                  </ButtonLink>
                  <button
                    type="button"
                    onClick={clear}
                    className="press w-full text-center text-xs text-muted underline underline-offset-2 hover:text-foreground"
                  >
                    Clear all favorites
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
