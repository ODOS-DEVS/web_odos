import type { Order } from "@/types/order";

/**
 * Whether the customer may cancel an order themselves, and what to say when not.
 *
 * Mirrors `cancel_order` in the API: it allows `pending_payment` and
 * `processing`, then refuses any order whose payment has landed unless it is
 * still `pending_payment`. Since `processing` is only ever reached by a
 * successful payment, that leaves exactly one self-service case -- an order
 * waiting to be paid.
 *
 * Deciding this here, from the order's own lifecycle rather than from the
 * package rollup in `order.status`, is what keeps the button from appearing on
 * orders the API will refuse.
 */
export type CancelAbility =
  | { can: true }
  | { can: false; reason: string | null };

export function isPaid(order: Order): boolean {
  return /paid|success/i.test(order.paymentStatus);
}

export function cancelAbility(order: Order): CancelAbility {
  if (order.lifecycle === "cancelled" || order.status === "cancelled") {
    // Nothing to offer and nothing to explain: the badge already says so.
    return { can: false, reason: null };
  }

  if (order.lifecycle === "pending_payment") {
    if (isPaid(order)) {
      // Paid, but not yet moved on. The API would cancel this without
      // refunding anything, so it is not offered as a plain cancel.
      return {
        can: false,
        reason: "This order is paid and being set up. Message the vendor to change or cancel it, and they'll sort out a refund.",
      };
    }
    return { can: true };
  }

  // Paid and in the vendors' hands. Cancelling is theirs to agree to, and
  // anything already delivered goes through a return instead.
  const delivered = order.packages.some((p) => p.status === "delivered");
  return {
    can: false,
    reason: delivered
      ? "Part of this order has arrived. Start a return on the item you don't want to keep."
      : "The vendors are already working on this order. Message them to ask for it to be stopped, and they'll sort out a refund.",
  };
}
