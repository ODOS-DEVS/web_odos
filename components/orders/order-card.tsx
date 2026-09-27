import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Order } from "@/types/order";
import { formatDate, formatMoney } from "@/libs/format";
import { Media } from "@/components/ui/media";
import { StatusBadge } from "./status-badge";

export function OrderCard({ order }: { order: Order }) {
  const items = order.packages.flatMap((pkg) => pkg.items);
  const shown = items.slice(0, 4);
  const vendors = order.packages.length;

  return (
    <article className="group relative rounded-2xl border border-line bg-surface p-5 transition-[border-color,box-shadow] duration-200 hover:border-foreground/30 hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold tracking-normal">
            <Link href={`/orders/${order.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              Order {order.number}
            </Link>
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Placed <time dateTime={order.placedAt}>{formatDate(order.placedAt)}</time>
            {vendors > 0 && (
              <>
                {" "}
                · {vendors} {vendors === 1 ? "vendor" : "vendors"}
              </>
            )}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex -space-x-2.5 sm:-space-x-3">
          {shown.map((item) => (
            <Media key={item.id} src={item.imageUrl} name={item.name} sizes="48px" className="size-10 rounded-full ring-2 ring-surface sm:size-12" />
          ))}
          {items.length > shown.length && (
            <span className="grid size-10 place-items-center rounded-full bg-surface-muted text-xs font-medium ring-2 ring-surface tabular-nums sm:size-12">
              +{items.length - shown.length}
            </span>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <p className="font-semibold tabular-nums">{formatMoney(order.total)}</p>
          <ChevronRight className="size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </div>
      </div>
    </article>
  );
}
