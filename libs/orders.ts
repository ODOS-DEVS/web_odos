import type { FulfilmentStatus, OrderPackage } from "@/types/order";

/** Happy-path progression, least to most advanced. */
export const PROGRESS_STEPS = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
] as const satisfies readonly FulfilmentStatus[];

export const STATUS_LABEL: Record<FulfilmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

const RANK: Record<FulfilmentStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  out_for_delivery: 3,
  delivered: 4,
  // Not on the happy path; handled explicitly in `rollupStatus`.
  delayed: -1,
  cancelled: -1,
};

/**
 * An order's overall status is the least advanced of its packages, so problems surface above
 * "delivered": two delivered packages plus one delayed reads as delayed. Cancelled packages are
 * ignored unless every package is cancelled.
 */
export function rollupStatus(packages: Pick<OrderPackage, "status">[]): FulfilmentStatus {
  if (packages.some((p) => p.status === "delayed")) return "delayed";

  const live = packages.filter((p) => p.status !== "cancelled");
  if (live.length === 0) return "cancelled";

  return live.reduce<FulfilmentStatus>(
    (least, p) => (RANK[p.status] < RANK[least] ? p.status : least),
    live[0].status,
  );
}

/** Index of the current step in PROGRESS_STEPS (-1 before the first step). */
export function progressIndex(status: FulfilmentStatus) {
  return PROGRESS_STEPS.indexOf(status as (typeof PROGRESS_STEPS)[number]);
}

export const packageTotal = (pkg: OrderPackage) => pkg.itemsSubtotal - pkg.discountShare + pkg.deliveryFee;

export const isActive = (status: FulfilmentStatus) => status !== "delivered" && status !== "cancelled";
