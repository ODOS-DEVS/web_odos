/** Courier profile (GET /courier/me). */
export type CourierProfile = {
  id: string;
  vehicleType: string;
  plateNumber: string | null;
  isOnline: boolean;
  rating: number | null;
  totalDeliveries: number;
  /** Set when the courier rides for one store rather than the open pool. */
  vendorId: string | null;
};

/** An unclaimed job in the delivery pool. */
export type DeliveryOffer = {
  id: string;
  orderNumber: string;
  pickupName: string | null;
  pickupArea: string | null;
  dropoffArea: string | null;
  itemCount: number;
  status: string;
  slaDeadline: string;
  createdAt: string;
};

export type Delivery = {
  id: string;
  orderId: string;
  orderNumber: string;
  /** Free text on the wire (e.g. "accepted", "at_pickup", "out_for_delivery"). */
  status: string;
  pickup: { name: string | null; address: string | null; lat: number | null; lng: number | null };
  dropoff: { area: string | null; address: string | null; lat: number | null; lng: number | null };
  customerName: string | null;
  instructions: string | null;
  itemCount: number;
  attemptCount: number;
  failureReason: string | null;
  acceptedAt: string | null;
  arrivedAtPickupAt: string | null;
  pickedUpAt: string | null;
  arrivedAtCustomerAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

export type DeliveryEvent = {
  event: string;
  fromStatus: string | null;
  toStatus: string | null;
  actor: string;
  at: string;
};

/** The state-machine steps a courier can request on a delivery. */
export type DeliveryStep =
  | "start-pickup"
  | "arrive-at-pickup"
  | "begin-pickup-verification"
  | "start-dropoff"
  | "arrive-at-customer"
  | "begin-delivery-verification"
  | "report-customer-unavailable"
  | "fail-delivery"
  | "start-return"
  | "release";
