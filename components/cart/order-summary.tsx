import type { ReactNode } from "react";
import { formatMoney } from "@/libs/format";
import { cn } from "@/libs/cn";

type Totals = { items: number; delivery: number | null; total: number; vendors: number };

export function OrderSummary({
  totals,
  discount = 0,
  children,
  className,
}: {
  totals: Totals;
  discount?: number;
  children?: ReactNode;
  className?: string;
}) {
  const total = totals.total - discount;

  return (
    <section
      aria-label="Order summary"
      className={cn("rounded-2xl border border-line bg-surface p-5 sm:p-6", className)}
    >
      <h2 className="text-lg font-semibold tracking-normal">Order summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Items</dt>
          <dd className="tabular-nums">{formatMoney(totals.items)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between gap-4 text-success">
            <dt>Discount</dt>
            <dd className="tabular-nums">−{formatMoney(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-muted">
            Delivery
            <span className="block text-xs">
              {totals.vendors} {totals.vendors === 1 ? "vendor" : "vendors"}, each delivers separately
            </span>
          </dt>
          <dd className="text-right tabular-nums">
            {totals.delivery === null ? (
              <span className="text-muted">Calculating…</span>
            ) : totals.delivery === 0 ? (
              "Free"
            ) : (
              formatMoney(totals.delivery)
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4 text-base font-semibold">
          <dt>Total</dt>
          <dd className="text-xl tabular-nums">{formatMoney(total)}</dd>
        </div>
      </dl>
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
