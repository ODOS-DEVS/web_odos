import { AlertTriangle, CheckCircle2, Clock, Truck, XCircle } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { orderStateCopy, type OrderTone } from "@/libs/order-state";
import type { Order } from "@/types/order";

const TONE: Record<OrderTone, BadgeTone> = {
  pending: "neutral",
  active: "accent",
  good: "success",
  warning: "warning",
  dead: "neutral",
};

const ICON: Record<OrderTone, typeof Clock> = {
  pending: Clock,
  active: Truck,
  good: CheckCircle2,
  warning: AlertTriangle,
  dead: XCircle,
};

/**
 * One badge for an order's real state, from the same source as the detail page.
 *
 * Replaces the bare fulfilment rollup on list rows, which could only ever say
 * "Pending" for an order that was actually awaiting payment, cancelled with a
 * refund in flight, or waiting on the seller to approve a cancellation.
 */
export function OrderStateBadge({ order, className }: { order: Order; className?: string }) {
  const { label, tone } = orderStateCopy(order);
  const Icon = ICON[tone];
  return (
    <Badge tone={TONE[tone]} className={className}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </Badge>
  );
}
