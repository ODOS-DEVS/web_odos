import { AlertTriangle, CheckCircle2, Clock, PackageCheck, Truck, XCircle } from "lucide-react";
import type { FulfilmentStatus } from "@/types/order";
import { STATUS_LABEL } from "@/libs/orders";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const TONE: Record<FulfilmentStatus, BadgeTone> = {
  pending: "neutral",
  confirmed: "neutral",
  preparing: "warning",
  out_for_delivery: "accent",
  delivered: "success",
  delayed: "danger",
  cancelled: "neutral",
};

const ICON = {
  pending: Clock,
  confirmed: PackageCheck,
  preparing: PackageCheck,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  delayed: AlertTriangle,
  cancelled: XCircle,
} as const satisfies Record<FulfilmentStatus, unknown>;

export function StatusBadge({ status, className }: { status: FulfilmentStatus; className?: string }) {
  const Icon = ICON[status];
  return (
    <Badge tone={TONE[status]} className={className}>
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
