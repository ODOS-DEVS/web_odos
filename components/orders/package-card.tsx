import Link from "next/link";
import { AlertTriangle, Truck } from "lucide-react";
import type { OrderPackage } from "@/types/order";
import type { Store } from "@/types/catalog";
import { formatMoney } from "@/libs/format";
import { packageTotal } from "@/libs/orders";
import { Media } from "@/components/ui/media";
import { StatusBadge } from "./status-badge";
import { StatusTimeline } from "./status-timeline";

/** One vendor's part of an order, with its own status, delivery and totals. */
export function PackageCard({ pkg, store, index }: { pkg: OrderPackage; store?: Store; index: number }) {
  return (
    <section aria-labelledby={`pkg-${pkg.id}`} className="overflow-hidden rounded-2xl border border-line bg-surface">
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-muted/50 px-4 py-3 sm:px-5">
        <Media src={store?.logoUrl} name={pkg.storeName} sizes="40px" className="size-10 shrink-0 rounded-full" imgClassName="object-contain p-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Package {index + 1}</p>
          <h2 id={`pkg-${pkg.id}`} className="truncate font-semibold tracking-normal">
            {store ? (
              <Link href={`/stores/${store.slug}`} className="hover:underline">
                {pkg.storeName}
              </Link>
            ) : (
              pkg.storeName
            )}
          </h2>
        </div>
        <StatusBadge status={pkg.status} />
      </header>

      <div className="space-y-5 p-4 sm:p-5">
        <StatusTimeline status={pkg.status} />

        {pkg.status === "delayed" && (
          <p className="flex gap-2.5 rounded-xl bg-danger-soft p-3 text-sm text-danger" role="status">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {pkg.problem ? `${pkg.problem}. ` : "This package is delayed. "}Other packages in your order are not affected and will still arrive on their
              own schedule.
            </span>
          </p>
        )}

        {pkg.eta && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <Truck className="size-4 text-muted" aria-hidden />
            <span className="font-medium">{pkg.eta}</span>
          </p>
        )}

        <ul className="divide-y divide-line rounded-xl border border-line">
          {pkg.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <Media src={item.imageUrl} name={item.name} sizes="56px" className="size-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.productId}`} className="line-clamp-2 text-sm font-medium hover:underline">
                  {item.name}
                </Link>
                <p className="text-xs text-muted tabular-nums">
                  {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ")}
                  {(item.size || item.color) && " · "}
                  {item.quantity} × {formatMoney(item.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-medium tabular-nums">{formatMoney(item.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Items</dt>
            <dd className="tabular-nums">{formatMoney(pkg.itemsSubtotal)}</dd>
          </div>
          {pkg.discountShare > 0 && (
            <div className="flex justify-between gap-4 text-success">
              <dt>Discount</dt>
              <dd className="tabular-nums">−{formatMoney(pkg.discountShare)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Delivery</dt>
            <dd className="tabular-nums">{pkg.deliveryFee === 0 ? (pkg.deliveryFeeWaived ? "Free (waived)" : "Free") : formatMoney(pkg.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-2 font-semibold">
            <dt>Package total</dt>
            <dd className="tabular-nums">{formatMoney(packageTotal(pkg))}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
