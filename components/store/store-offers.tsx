import Link from "next/link";
import { Percent, TreePalm, Truck } from "lucide-react";
import type { ReactNode } from "react";
import type { Product, Store } from "@/types/catalog";
import { discountPercent } from "@/libs/format";

function Offer({ icon, title, children, href, tone = "success" }: { icon: ReactNode; title: string; children: ReactNode; href?: string; tone?: "success" | "warning" }) {
  const body = (
    <>
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone === "warning" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{children}</span>
      </span>
    </>
  );
  const cls = "flex items-start gap-3.5 rounded-2xl border border-line bg-surface p-4";
  return href ? (
    <Link href={href} className={`${cls} press hover:border-foreground/30`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** "Deals & benefits": what this vendor offers right now, derived from its real data. */
export function StoreOffers({ store, products }: { store: Store; products: Product[] }) {
  const onSale = products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
  const bestSale = Math.max(0, ...onSale.map((p) => discountPercent(p.price, p.compareAtPrice)));

  const offers: ReactNode[] = [];
  if (store.isOnVacation) {
    offers.push(
      <Offer key="vacation" tone="warning" icon={<TreePalm className="size-5" aria-hidden />} title="Store on vacation">
        {store.vacationMessage || "This store is not taking new orders right now."}
      </Offer>,
    );
  }
  if (store.deliveryBadge) {
    offers.push(
      <Offer key="delivery" icon={<Truck className="size-5" aria-hidden />} title={store.deliveryBadge}>
        Delivered by this store’s own riders.
      </Offer>,
    );
  }
  if (onSale.length > 0) {
    offers.push(
      <Offer
        key="sale"
        icon={<Percent className="size-5" aria-hidden />}
        title={`${onSale.length} ${onSale.length === 1 ? "item" : "items"} on sale`}
        href="#products"
      >
        Save up to {bestSale}% right now.
      </Offer>,
    );
  }
  if (offers.length === 0) return null;

  return (
    <section aria-labelledby="offers-heading">
      <h2 id="offers-heading" className="mb-4 text-xl font-semibold">
        Deals &amp; benefits
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{offers}</div>
    </section>
  );
}
