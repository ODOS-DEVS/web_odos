import { CheckCircle2, ChefHat, Clock, PackageCheck, Truck, XCircle } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { VENDOR_ORDER_STATUS_LABELS } from "@/libs/vendor-orders";
import type { VendorOrderStatus } from "@/types/vendor";

/** The shopper's `StatusBadge` cannot be reused: it has no `processing`/`ready` distinction. */
const TONE: Record<VendorOrderStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "neutral",
  processing: "neutral",
  ready: "accent",
  out_for_delivery: "accent",
  delivered: "success",
  cancelled: "neutral",
};

const ICON = {
  pending: Clock,
  confirmed: PackageCheck,
  processing: ChefHat,
  ready: PackageCheck,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
} as const satisfies Record<VendorOrderStatus, unknown>;

export function VendorStatusBadge({ status, className }: { status: VendorOrderStatus; className?: string }) {
  const Icon = ICON[status];
  return (
    <Badge tone={TONE[status]} className={className}>
      <Icon className="size-3.5" aria-hidden />
      {VENDOR_ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
