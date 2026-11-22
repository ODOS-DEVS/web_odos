import { STATUS_LABEL } from "@/libs/orders";
import type { Order } from "@/types/order";

/**
 * What an order's four state fields mean, said in words a shopper can act on.
 *
 * The backend keeps `status`, `paymentStatus`, `cancellationStatus` and
 * `refundStatus` separate because they are separate facts. This turns that
 * combination into one honest sentence — never a database value, and never a
 * claim that outruns what has actually happened. An order that is cancelled
 * with its money still in transit says exactly that.
 */

/**
 * Whether ODOS actually holds the money. Matches the API's
 * PAID_PAYMENT_STATUSES set ({paid, success, successful}) rather than testing
 * for "paid" alone, because the gateway's wording has varied.
 */
export function isPaid(order: Order): boolean {
  return ["paid", "success", "successful"].includes((order.paymentStatus || "").trim().toLowerCase());
}

export type OrderTone = "pending" | "active" | "good" | "warning" | "dead";

export type OrderStateCopy = {
  label: string;
  detail: string;
  tone: OrderTone;
};

const CANCEL_REASONS: Record<string, string> = {
  ordered_by_mistake: "Ordered by mistake",
  found_better_price: "Found a better price",
  changed_my_mind: "Changed my mind",
  wrong_product: "Wrong product selected",
  wrong_delivery_details: "Incorrect delivery details",
  taking_too_long: "Delivery taking too long",
  duplicate_order: "Duplicate order",
  out_of_stock: "Out of stock",
  product_unavailable: "Product unavailable",
  listing_error: "Listing was incorrect",
  cannot_fulfil: "Seller could not fulfil it",
  other: "Other",
};

export const cancellationReasonLabel = (code: string | null) =>
  code ? (CANCEL_REASONS[code] ?? code.replace(/_/g, " ")) : null;

/** Reasons a shopper can pick when cancelling. Mirrors the API's accepted set. */
export const SHOPPER_CANCEL_REASONS = [
  { value: "changed_my_mind", label: "I changed my mind" },
  { value: "ordered_by_mistake", label: "I ordered this by mistake" },
  { value: "found_better_price", label: "I found a better price" },
  { value: "wrong_product", label: "I picked the wrong product" },
  { value: "wrong_delivery_details", label: "My delivery details are wrong" },
  { value: "taking_too_long", label: "It's taking too long" },
  { value: "duplicate_order", label: "I ordered this twice" },
  { value: "other", label: "Something else" },
] as const;

/**
 * The headline state. Order matters: the most consequential truth wins, so a
 * cancelled order never reads "processing" just because its fulfilment column
 * was never cleared.
 */
export function orderStateCopy(order: Order): OrderStateCopy {
  const { lifecycle, paymentStatus, cancellationStatus, refundStatus } = order;

  if (cancellationStatus === "requested") {
    return {
      label: "Cancellation requested",
      detail:
        "We've received your cancellation request and it's being reviewed. We'll let you know as soon as there's a decision.",
      tone: "warning",
    };
  }

  if (lifecycle === "cancelled") {
    if (refundStatus === "successful") {
      return {
        label: "Cancelled and refunded",
        detail: "This order was cancelled and your refund has been paid out.",
        tone: "dead",
      };
    }
    if (refundStatus === "failed") {
      return {
        label: "Cancelled · refund needs attention",
        detail:
          "This order was cancelled but your refund didn't go through. We're looking into it and will be in touch.",
        tone: "warning",
      };
    }
    if (refundStatus !== "not_applicable") {
      return {
        label: "Cancelled · refund on the way",
        detail:
          "This order was cancelled. Your refund has been started and we'll confirm here once the money has been sent.",
        tone: "warning",
      };
    }
    return {
      label: "Cancelled",
      detail: "This order was cancelled. Nothing was charged.",
      tone: "dead",
    };
  }

  if (lifecycle === "expired") {
    return {
      label: "Expired",
      detail:
        "This order expired because payment wasn't completed in time. Nothing was charged — you can order again any time.",
      tone: "dead",
    };
  }

  if (lifecycle === "payment_failed" || paymentStatus === "failed") {
    return {
      label: "Payment failed",
      detail: "Your payment didn't go through, so this order was never confirmed. You can try again.",
      tone: "dead",
    };
  }

  if (lifecycle === "pending_payment") {
    if (paymentStatus === "pending") {
      return {
        label: "Checking your payment",
        detail:
          "We're confirming your payment with the provider. Please don't pay again — we'll update this order as soon as we hear back.",
        tone: "pending",
      };
    }
    return {
      label: "Awaiting payment",
      detail:
        "We have your order details, but payment hasn't been completed — so this order isn't confirmed yet.",
      tone: "pending",
    };
  }

  if (lifecycle === "delivered" || lifecycle === "completed") {
    return {
      label: "Delivered",
      detail: "This order has been delivered.",
      tone: "good",
    };
  }

  // Alive and paid for. Here the fulfilment rollup is the most useful thing to
  // say, so it supplies the label -- which is why this is the single place any
  // surface needs to ask about an order's state.
  return {
    label: STATUS_LABEL[order.status],
    detail: LIVE_DETAIL[order.status],
    tone: order.status === "delayed" ? "warning" : "active",
  };
}

/** What each live fulfilment stage means for the shopper, in their terms. */
const LIVE_DETAIL: Record<Order["status"], string> = {
  pending: "Your payment is confirmed. The seller has seen the order and hasn't accepted it yet.",
  confirmed: "The seller has accepted your order and will start preparing it.",
  preparing: "The seller is packing your order now.",
  out_for_delivery: "Your order has left the seller and is on its way to you.",
  delivered: "This order has been delivered.",
  delayed: "Something has held this order up. We're on it — check the packages below for detail.",
  cancelled: "This order was cancelled.",
};

/**
 * Whether the shopper may ask to cancel, what to say when they may not, and
 * whether saying yes ends the order or only files a request.
 *
 * This deliberately mirrors `can_request_cancellation` in
 * `app/services/order_state_service.py` clause for clause, reading the same
 * order-level `vendor_status` the server reads. The point is that the button
 * never appears on an order the API will refuse, and never promises an outright
 * cancellation when the real outcome is "the seller has to agree".
 *
 * The server stays the authority: this only decides what to render.
 */
export type Cancellability = {
  can: boolean;
  /** Why not — or, when `can`, what will actually happen. Null when the badge already says it. */
  reason: string | null;
  /** True when the request goes to the seller or waits on the payment provider. */
  requiresReview: boolean;
};

/** Stages at which the vendor has not yet committed work. Mirrors BEFORE_VENDOR_ACCEPTS. */
const BEFORE_VENDOR_ACCEPTS = new Set(["pending", ""]);

/** Mirrors AFTER_DISPATCH. */
const AFTER_DISPATCH = new Set(["out_for_delivery", "delivered"]);

export function cancellability(order: Order): Cancellability {
  const stage = (order.vendorStage || "pending").trim().toLowerCase();
  const lifecycle = (order.lifecycle || "").trim().toLowerCase();

  if (order.cancellationStatus === "requested") {
    return {
      can: false,
      reason: "A cancellation request for this order is already being reviewed.",
      requiresReview: false,
    };
  }
  if (order.cancellationStatus === "completed" || lifecycle === "cancelled") {
    // The badge already says "Cancelled"; repeating it as a warning is noise.
    return { can: false, reason: null, requiresReview: false };
  }
  if (["expired", "payment_failed"].includes(lifecycle)) {
    return { can: false, reason: null, requiresReview: false };
  }

  if (AFTER_DISPATCH.has(stage) || ["delivered", "completed"].includes(lifecycle)) {
    if (["delivered", "completed"].includes(lifecycle)) {
      return {
        can: false,
        reason: "This order has been delivered. Start a return instead and we'll refund you once it's back.",
        requiresReview: false,
      };
    }
    return {
      can: false,
      reason:
        "This order is already on its way. Contact support to try to intercept it, or refuse the delivery and we'll refund you.",
      requiresReview: false,
    };
  }

  // Payment in flight: the provider has been asked and hasn't answered, so the
  // server records the request and finishes it once the outcome is known.
  if (lifecycle === "pending_payment" && order.paymentStatus === "pending") {
    return {
      can: true,
      reason:
        "Your payment is still being confirmed. We'll finish the cancellation as soon as we know the outcome.",
      requiresReview: true,
    };
  }

  if (!isPaid(order)) {
    return { can: true, reason: null, requiresReview: false };
  }

  if (BEFORE_VENDOR_ACCEPTS.has(stage)) {
    return { can: true, reason: null, requiresReview: false };
  }

  return {
    can: true,
    reason:
      "The seller has already started preparing this order, so they need to approve the cancellation.",
    requiresReview: true,
  };
}

/**
 * Whether the order is still going somewhere.
 *
 * Decided from the lifecycle, not the package rollup: an order cancelled while
 * its packages were still `pending` rolls up to "pending" and would otherwise
 * be filed under "In progress" forever.
 */
export function isOrderLive(order: Order): boolean {
  const lifecycle = (order.lifecycle || "").trim().toLowerCase();
  if (["cancelled", "expired", "payment_failed", "delivered", "completed"].includes(lifecycle)) {
    return false;
  }
  return order.status !== "delivered" && order.status !== "cancelled";
}

/** Whether the order has arrived, from the lifecycle first. */
export function isOrderDelivered(order: Order): boolean {
  const lifecycle = (order.lifecycle || "").trim().toLowerCase();
  if (["cancelled", "expired", "payment_failed"].includes(lifecycle)) return false;
  return ["delivered", "completed"].includes(lifecycle) || order.status === "delivered";
}

/**
 * The payment in plain words.
 *
 * `payment_status` has historically held values that answer the wrong question
 * -- "cancelled" says nothing about whether money moved -- so nothing raw from
 * that column is ever shown to a shopper.
 */
export function paymentStateLabel(order: Order): string {
  const status = (order.paymentStatus || "").trim().toLowerCase();
  if (["paid", "success", "successful"].includes(status)) return "Paid";
  if (status === "failed") return "Payment failed";
  if (status === "expired") return "Payment window closed";
  if (status === "pending") return "Awaiting confirmation";
  if (status === "refunded") return "Refunded";
  // Anything else (including the legacy "cancelled") only tells us ODOS never
  // took the money, so that is all it is allowed to say.
  return "Not paid";
}
