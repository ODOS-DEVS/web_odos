"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Receipt } from "lucide-react";
import { formatDate, formatMoney } from "@/libs/format";
import { useVoucherRedemptions } from "@/hooks/use-vendor-ops";

/**
 * Per-voucher redemption history, collapsed by default so opening the vouchers page does not
 * fire one request per voucher.
 */
export function VoucherRedemptions({ voucherId, count }: { voucherId: string; count: number }) {
  const [open, setOpen] = useState(false);
  const { data, isPending, isError } = useVoucherRedemptions(open ? voucherId : undefined);

  if (count === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press inline-flex items-center gap-1 text-xs font-medium text-accent"
      >
        <Receipt className="size-3.5" aria-hidden />
        {open ? "Hide" : "View"} redemptions
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="mt-2 rounded-xl bg-surface-muted p-3">
          {isPending ? (
            <p className="text-xs text-muted">Loading redemptions…</p>
          ) : isError ? (
            <p className="text-xs text-danger">We couldn&apos;t load redemptions for this voucher.</p>
          ) : !data?.length ? (
            <p className="text-xs text-muted">No redemptions recorded yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-xs">
                  <Link href={`/seller/orders/${r.orderId}`} className="press truncate text-accent">
                    Order {r.orderId.slice(0, 8)}
                  </Link>
                  <span className="shrink-0 text-muted">
                    <time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
                    {" · "}
                    <span className="font-medium text-foreground">{formatMoney(r.discountAmount)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
