import type { DeliverySpeed } from "./delivery";

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
};

export type Order = {
  id: string;
  number: string;
  placedAt: string;
  status: FulfilmentStatus;
  paymentStatus: string;
  paymentLabel: string;
  deliveryMethod: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  packages: OrderPackage[];
  timeline: TrackingEvent[];
  address: {
    name: string;
    phone: string;
    street: string;
    city: string;
    region: string;
  };
};
