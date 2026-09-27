"use client";

import Link from "next/link";
import { Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import type { CartGroup as CartGroupData } from "@/types/cart";
import type { PackageQuote } from "@/types/delivery";
import { useCart } from "@/hooks/use-cart";
import { maxQuantity } from "@/libs/cart";
import { formatMoney, formatMoneyCompact } from "@/libs/format";
import { Media } from "@/components/ui/media";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

/** One vendor's part of the cart. `pkg` is that vendor's live delivery quote (undefined while loading). */
export function CartGroup({ group, pkg }: { group: CartGroupData; pkg?: PackageQuote }) {
  const { setQuantity, remove, restore } = useCart();
  const { store, lines, subtotal, name } = group;

  const threshold = pkg && pkg.freeThreshold > 0 ? pkg.freeThreshold : null;
  const remaining = pkg?.amountToFreeDelivery ?? null;
  const progress = threshold ? Math.min(subtotal / threshold, 1) : 1;
  const unlocked = threshold !== null && (pkg?.feeWaived || remaining === null || remaining <= 0);

  const removeLine = (key: string, lineName: string) => {
    const line = lines.find((l) => l.key === key);
    remove(key);
    toast(`Removed ${lineName}`, { action: { label: "Undo", onClick: () => line && restore(line) } });
  };

  const heading = `vendor-${group.storeId ?? "unknown"}`;

  return (
    <section aria-labelledby={heading} className="overflow-hidden rounded-2xl border border-line bg-surface">
      <header className="flex items-center gap-3 border-b border-line bg-surface-muted/50 px-4 py-3 sm:px-5">
        <Media src={store?.logoUrl} name={name} sizes="40px" className="size-10 shrink-0 rounded-full" imgClassName="object-contain p-0.5" />
        <div className="min-w-0 flex-1">
          <h2 id={heading} className="truncate font-semibold tracking-normal">
            {store ? (
              <Link href={`/stores/${store.slug}`} className="hover:underline">
                {name}
              </Link>
            ) : (
              name
            )}
          </h2>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Truck className="size-3.5" aria-hidden />
            Delivered by this vendor
          </p>
        </div>
      </header>

      <ul className="divide-y divide-line">
        {lines.map((line) => (
          <li key={line.key} className="flex gap-4 p-4 sm:p-5">
            <Link href={`/products/${line.productId}`} className="shrink-0" aria-label={line.name}>
              <Media src={line.imageUrl} name={line.name} sizes="96px" className="size-20 rounded-xl sm:size-24" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
              <div className="flex flex-col gap-1 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between min-[400px]:gap-3">
                <div className="min-w-0">
                  <Link href={`/products/${line.productId}`} className="line-clamp-2 text-sm font-medium hover:underline sm:text-base">
                    {line.name}
                  </Link>
                  {(line.size || line.color) && (
                    <p className="mt-0.5 text-xs text-muted">{[line.size && `Size ${line.size}`, line.color].filter(Boolean).join(" · ")}</p>
                  )}
                  <Price value={line.price} className="mt-1 text-sm" />
                </div>
                <p className="order-first shrink-0 font-semibold tabular-nums min-[400px]:order-0">{formatMoney(line.price * line.quantity)}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <QuantityStepper
                  size="sm"
                  label={`Quantity of ${line.name}`}
                  value={line.quantity}
                  max={maxQuantity(line)}
                  onChange={(next) => setQuantity(line.key, next)}
                />
                <button
                  type="button"
                  onClick={() => removeLine(line.key, line.name)}
                  className="press inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="hidden min-[400px]:inline">Remove</span>
                  <span className="sr-only min-[400px]:hidden">Remove {line.name}</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <footer className="border-t border-line bg-surface-muted/50 px-4 py-4 text-sm sm:px-5">
        {threshold !== null && (
          <div className="mb-4">
            <p className={unlocked ? "font-medium text-success" : "text-muted"}>
              {unlocked
                ? "You’ve unlocked free delivery from this vendor"
                : `Add ${formatMoneyCompact(remaining ?? Math.max(threshold - subtotal, 0))} more for free delivery`}
            </p>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label="Progress to free delivery"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div
                className="h-full origin-left rounded-full bg-success transition-transform duration-500 ease-out"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </div>
        )}
        <dl className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Delivery</dt>
            <dd className="tabular-nums">{!pkg ? <span className="text-muted">Calculating…</span> : pkg.deliveryFee === 0 ? "Free" : formatMoney(pkg.deliveryFee)}</dd>
          </div>
        </dl>
      </footer>
    </section>
  );
}
