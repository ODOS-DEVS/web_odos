import type { VendorOrder, VendorOrderStatus, VendorProductStatus } from "@/types/vendor";

/**
 * The vendor fulfilment ladder, mirroring the mobile app's `utils/vendorOrderFulfillment.ts`
 * and the backend's `VENDOR_STATUS_FORWARD_TRANSITIONS` (vendor_controller.py:123), which
 * documents itself as mirroring the same file.
 *
 * Why this is a separate domain from the shopper's `FulfilmentStatus`: that type collapses
 * `processing` and `ready` into one "preparing" value, which makes `ready -> out_for_delivery`
 * impossible to express. The backend only accepts exact single steps, so a flattened status
 * cannot drive these writes.
 */
export const VENDOR_ORDER_NEXT_STATUS: Partial<Record<VendorOrderStatus, VendorOrderStatus>> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "ready",
  ready: "out_for_delivery",
};

/**
 * `delivered` is deliberately absent above and unreachable by a vendor: the customer confirms
 * the handoff in their own app (or it auto-releases), because a vendor self-certifying a
 * delivery they are paid for proves nothing. The backend rejects it with a 400.
 */
export const VENDOR_ORDER_STATUS_LABELS: Record<VendorOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Imperative for the button that advances an order one step. */
const VENDOR_ORDER_ACTION_LABELS: Partial<Record<VendorOrderStatus, string>> = {
  pending: "Confirm order",
  confirmed: "Start preparing",
  processing: "Mark ready",
  ready: "Dispatch",
};

export const VENDOR_ORDER_TIMELINE: VendorOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "out_for_delivery",
  "delivered",
];

const VENDOR_ORDER_STATUSES = new Set<string>(VENDOR_ORDER_TIMELINE.concat("cancelled"));

const NEW_STATUSES = new Set<VendorOrderStatus>(["pending", "confirmed"]);
const ACTIVE_STATUSES = new Set<VendorOrderStatus>(["processing", "ready", "out_for_delivery"]);
const DONE_STATUSES = new Set<VendorOrderStatus>(["delivered", "cancelled"]);

/**
 * Reads the vendor status off the wire.
 *
 * `status` on `VendorOrderRead` is already one of the seven canonical values and describes
 * *this vendor's package*, so it is used as-is. It must never be run through the shopper's
 * `normaliseStatus`: that joins `delivery_status` into the text, and the default
 * "not_dispatched" contains the substring "dispatch", which matched the out-for-delivery
 * rule and reported every undispatched order as already on its way.
 */
export function toVendorOrderStatus(status: string): VendorOrderStatus {
  const value = status.trim().toLowerCase();
  return VENDOR_ORDER_STATUSES.has(value) ? (value as VendorOrderStatus) : "pending";
}

export function getVendorOrderNextStatus(status: VendorOrderStatus) {
  return VENDOR_ORDER_NEXT_STATUS[status] ?? null;
}

export function getVendorOrderNextActionLabel(status: VendorOrderStatus) {
  return VENDOR_ORDER_ACTION_LABELS[status] ?? null;
}

/** Cancellation is only offered before prep starts, matching `VENDOR_STATUS_CANCELLABLE_FROM`. */
export function canCancelVendorOrder(status: VendorOrderStatus) {
  return status === "pending" || status === "confirmed";
}

export function canAcknowledgeVendorOrder(status: VendorOrderStatus) {
  return NEW_STATUSES.has(status);
}

export type VendorOrderQueue = "new" | "active" | "done";

export const VENDOR_ORDER_QUEUES: { id: VendorOrderQueue; label: string }[] = [
  { id: "new", label: "New" },
  { id: "active", label: "Active" },
  { id: "done", label: "Done" },
];

function queueOf(status: VendorOrderStatus): VendorOrderQueue {
  if (NEW_STATUSES.has(status)) return "new";
  if (ACTIVE_STATUSES.has(status)) return "active";
  return "done";
}

/** Oldest first while the vendor still owes the customer something; newest first once closed. */
export function filterVendorOrdersByQueue(orders: VendorOrder[], queue: VendorOrderQueue) {
  const filtered = orders.filter((order) => queueOf(order.status) === queue);
  const anchor = (order: VendorOrder) => Date.parse(order.paidAt ?? order.placedAt) || 0;
  return filtered.sort((a, b) => (queue === "done" ? anchor(b) - anchor(a) : anchor(a) - anchor(b)));
}

export function countVendorOrdersByQueue(orders: VendorOrder[]) {
  return {
    new: orders.filter((o) => NEW_STATUSES.has(o.status)).length,
    active: orders.filter((o) => ACTIVE_STATUSES.has(o.status)).length,
    done: orders.filter((o) => DONE_STATUSES.has(o.status)).length,
  };
}

export const isVendorOrderOpen = (status: VendorOrderStatus) => !DONE_STATUSES.has(status);

/** Matches mobile's "danger" SLA threshold, so a late badge and the overdue count always agree. */
export const VENDOR_ORDER_OVERDUE_MINUTES = 45;

export function getVendorOrderWaitMinutes(order: VendorOrder, now = Date.now()) {
  const anchor = Date.parse(order.paidAt ?? order.placedAt);
  if (!Number.isFinite(anchor)) return 0;
  return Math.max(0, Math.floor((now - anchor) / 60_000));
}

export function isVendorOrderOverdue(order: VendorOrder, now = Date.now()) {
  return isVendorOrderOpen(order.status) && getVendorOrderWaitMinutes(order, now) >= VENDOR_ORDER_OVERDUE_MINUTES;
}

export function formatVendorOrderWaitLabel(order: VendorOrder, now = Date.now()) {
  const minutes = getVendorOrderWaitMinutes(order, now);
  if (minutes < 1) return "Just placed";
  if (minutes < 60) return `${minutes}m waiting`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainder = minutes % 60;
    return remainder > 0 ? `${hours}h ${remainder}m waiting` : `${hours}h waiting`;
  }

  // Past a day, hours stop being readable: "758h waiting" is a number nobody converts.
  const days = Math.floor(hours / 24);
  if (days < 14) {
    const remainderHours = hours % 24;
    return remainderHours > 0 ? `${days}d ${remainderHours}h waiting` : `${days}d waiting`;
  }
  return `${Math.floor(days / 7)}w waiting`;
}

export function formatVendorDeliveryMethod(method?: string | null) {
  if (!method) return "Standard delivery";
  if (method === "express") return "Express delivery";
  if (method === "economy") return "Economy delivery";
  return method.replace(/_/g, " ");
}

/* ---------- Product status ---------- */


const PRODUCT_STATUSES = new Set<string>([
  "active",
  "hidden",
  "pending",
  "out_of_stock",
  "suspended",
  "draft",
]);

export function toVendorProductStatus(status: string): VendorProductStatus {
  const value = status.trim().toLowerCase();
  return PRODUCT_STATUSES.has(value) ? (value as VendorProductStatus) : "pending";
}

export const VENDOR_PRODUCT_STATUS_LABELS: Record<VendorProductStatus, string> = {
  active: "Live",
  hidden: "Hidden",
  pending: "Under review",
  out_of_stock: "Out of stock",
  suspended: "Suspended",
  draft: "Draft",
};

/** Hiding needs the product live or out of stock; republishing needs it hidden/out-of-stock and in stock. */
export const canHideVendorProduct = (status: VendorProductStatus) =>
  status === "active" || status === "out_of_stock";

export const canRepublishVendorProduct = (status: VendorProductStatus, stock: number) =>
  (status === "hidden" || status === "out_of_stock") && stock > 0;
