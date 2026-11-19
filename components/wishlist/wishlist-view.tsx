"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, ShoppingBag, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Price } from "@/components/ui/price";
import { SectionHeading } from "@/components/ui/section-heading";
import { catalogQueries } from "@/services/queries";
import { formatMoney } from "@/libs/format";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useSavedStores, useToggleSavedStore } from "@/hooks/use-saved-stores";
import { SavedStoreCard } from "@/components/store/saved-store-card";
import { useSession } from "@/hooks/use-auth";
import type { Product } from "@/types/catalog";

/**
 * Saved items, checked against the live catalogue.
 *
 * A wishlist row is a *snapshot* taken when it was saved — it carries no stock and a price that
 * may be months old. The live product is fetched per row (the same cached query the product page
 * uses, so revisiting either is free) to answer the two things a shopper actually needs: can I
 * still buy this, and has the price moved. There is no bulk-by-ids endpoint to do it in one call.
 */

function SavedStores() {
  const saved = useSavedStores();
  const toggle = useToggleSavedStore();
  const rows = saved.data ?? [];
  // Signed-out shoppers have no server-side saves to show, and the section is a secondary
  // block on this page — so it simply stays out of the way rather than prompting to sign in.
  if (rows.length === 0) return null;

  return (
    <section className="mt-14">
      <SectionHeading
        title="Saved stores"
        description={`${rows.length} store${rows.length === 1 ? "" : "s"} saved to your account`}
        href="/account/saved-stores"
        hrefLabel="Manage"
      />
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <SavedStoreCard
            key={row.store.id}
            store={row.store}
            removing={toggle.isPending}
            onRemove={() => toggle.mutate({ storeId: row.store.id, saved: true })}
          />
        ))}
      </ul>
    </section>
  );
}

export function WishlistView() {
  const session = useSession();
  const { items, remove, clear, ready } = useFavorites();
  const cart = useCart();

  const live = useQueries({
    queries: items.map((item) => ({ ...catalogQueries.product(item.productId), retry: false })),
  });

  const rows = useMemo(
    () =>
      items.map((item, i) => {
        const query = live[i];
        const product = query?.data as Product | undefined;
        return {
          item,
          product,
          loading: query?.isPending ?? false,
          // A product the catalogue no longer returns has been delisted or deleted.
          gone: Boolean(query?.isError),
          outOfStock: product ? product.stock <= 0 : false,
          priceNow: product?.price ?? item.price,
          priceChanged: product ? Math.abs(product.price - item.price) > 0.009 : false,
        };
      }),
    [items, live],
  );

  const buyable = rows.filter((r) => r.product && !r.outOfStock);

  const addAll = () => {
    if (!buyable.length) return;
    for (const row of buyable) if (row.product) cart.add({ product: row.product });
    toast.success(`${buyable.length} item${buyable.length === 1 ? "" : "s"} added to your cart`);
  };

  if (!ready) {
    return (
      <Container className="py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      </Container>
    );
  }

  if (!items.length) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={<Heart className="size-10 text-muted" aria-hidden />}
          iconBadge
          title="Nothing saved yet"
          description="Tap the heart on any product to keep it here for later."
          action={<ButtonLink href="/products" size="lg">Browse products</ButtonLink>}
        />
        <SavedStores />
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-10">
      <SectionHeading
        title="Saved items"
        description={`${items.length} item${items.length === 1 ? "" : "s"} saved${session ? "" : " on this device"}`}
      />

      {!session && (
        <p className="mt-4 rounded-2xl bg-surface-muted p-4 text-sm text-muted">
          You&apos;re not signed in, so these are saved in this browser only.{" "}
          <Link href="/login?next=/wishlist" className="press font-medium text-accent">
            Sign in
          </Link>{" "}
          to keep them on your account and see them on your phone.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={addAll} disabled={!buyable.length}>
          <ShoppingBag className="size-4" aria-hidden />
          Add {buyable.length > 0 ? `${buyable.length} ` : ""}to cart
        </Button>
        <Button type="button" variant="ghost" onClick={() => clear()}>
          <Trash2 className="size-4" aria-hidden />
          Clear all
        </Button>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ item, product, loading, gone, outOfStock, priceNow, priceChanged }) => (
          <li key={item.productId} className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
            <Link href={`/products/${item.productId}`} className="press shrink-0">
              <Media src={item.imageUrl} name={item.name} sizes="88px" className="size-22 rounded-xl" />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/products/${item.productId}`} className="press min-w-0">
                <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
              </Link>

              <div className="mt-1">
                <Price value={priceNow} compareAt={item.compareAtPrice ?? undefined} />
              </div>

              {priceChanged && (
                <p className="mt-1 text-xs text-muted">
                  {priceNow < item.price ? "Price dropped" : "Price went up"} from {formatMoney(item.price)} since you
                  saved it
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {loading && <span className="text-xs text-muted">Checking availability…</span>}
                {gone && (
                  <Badge tone="neutral">
                    <TriangleAlert className="size-3.5" aria-hidden />
                    No longer available
                  </Badge>
                )}
                {outOfStock && <Badge tone="danger">Out of stock</Badge>}
                {product && !outOfStock && product.stock <= 5 && <Badge tone="warning">Only {product.stock} left</Badge>}
              </div>

              <div className="mt-auto flex items-center gap-2 pt-3">
                <Button
                  type="button"
                  size="sm"
                  disabled={!product || outOfStock}
                  onClick={() => {
                    if (!product) return;
                    cart.add({ product });
                    toast.success(`${product.name} added to your cart`);
                  }}
                >
                  Add to cart
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove ${item.name} from saved items`}
                  onClick={() => remove(item.productId)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <SavedStores />
    </Container>
  );
}
