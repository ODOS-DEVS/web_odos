import type { DeliverySpeed } from "./delivery";
import type { ReturnRequest } from "./returns";

export type { DeliverySpeed };

/**
 * UI-level status. The API exposes free-text `vendor_status` / `delivery_status` per package with no
 * documented enum, so `services/mappers.ts` normalises them onto this set defensively.
 */
export type FulfilmentStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "cancelled";

export type TrackingEvent = {
  at: string;
  label: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  size: string | null;
  color: string | null;
};

/** One package per vendor per order — the unit of fulfilment. */
export type OrderPackage = {
  id: string;
  number: number;
  storeId: string | null;
  storeName: string;
  status: FulfilmentStatus;
  items: OrderItem[];
  itemsSubtotal: number;
  discountShare: number;
  deliveryFee: number;
  deliveryFeeWaived: boolean;
  eta: string | null;
  problem: string | null;
  /** Set once the vendor hands the bag to a rider — before this there is nothing to confirm. */
  dispatchedAt: string | null;
  deliveredAt: string | null;
  rescheduleRequestedAt: string | null;
  rescheduleNote: string | null;
};

/** One attempt to return money, with the arithmetic that produced it. */
export type OrderRefund = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  itemsAmount: number;
  deliveryAmount: number;
  discountWithheld: number;
  gatewayFeeWithheld: number;
  reasonNote: string | null;
  /** Only present once the money has actually moved. */
  providerReference: string | null;
  failureReason: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  number: string;
  placedAt: string;
  status: FulfilmentStatus;
  /**
   * The API's own order-level status -- `pending_payment`, `processing` or
   * `cancelled` -- kept raw and separate from `status`, which is a rollup of
   * the packages and says nothing about whether the order may be cancelled.
   */
  lifecycle: string;
  /**
   * The order-level vendor stage, raw. This is the exact field the API's own
   * cancellation rule reads, so client-side gating mirrors the server instead
   * of inferring intent from the `packages` rollup.
   */
  vendorStage: string;
  paymentStatus: string;
  paymentLabel: string;
  deliveryMethod: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  packages: OrderPackage[];
  timeline: TrackingEvent[];
  /** 1–5 once the shopper has rated the delivery; null until then. */
  deliveryRating: number | null;
  deliveryProblem: string | null;
  rescheduleRequestedAt: string | null;
  rescheduleNote: string | null;
  /**
   * Cancellation and refund as their own dimensions, because they are separate
   * facts: an order can be cancelled, paid for, and still awaiting its money back.
   * "none" / "not_applicable" when nothing has happened.
   */
  cancellationStatus: "none" | "requested" | "completed" | "rejected";
  cancellationRequestedAt: string | null;
  cancellationReasonCode: string | null;
  cancellationDecisionNote: string | null;
  refundStatus:
    | "not_applicable"
    | "pending"
    | "approved"
    | "processing"
    | "successful"
    | "failed"
    | "partially_refunded";
  refunds: OrderRefund[];
  /** Return/exchange/refund requests the shopper has filed against this order. */
  returnRequests: ReturnRequest[];
  address: {
    name: string;
    phone: string;
    street: string;
    city: string;
    region: string;
  };
};
