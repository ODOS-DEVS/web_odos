import { COURIER_ENDPOINTS } from "@/libs/api-endpoint";
import type { Delivery, DeliveryEvent, DeliveryOffer, DeliveryStep, CourierProfile } from "@/types/courier";
import { ApiError, apiFetch } from "./http";

/* eslint-disable @typescript-eslint/no-explicit-any -- wire shapes are mapped field by field below */
const toProfile = (p: any): CourierProfile => ({
  id: p.id,
  vehicleType: p.vehicle_type,
  plateNumber: p.plate_number ?? null,
  isOnline: Boolean(p.is_online),
  rating: p.rating ?? null,
  totalDeliveries: p.total_deliveries ?? 0,
  vendorId: p.vendor_id ?? null,
});

const toOffer = (o: any): DeliveryOffer => ({
  id: o.id,
  orderNumber: o.order_number,
  pickupName: o.pickup_name ?? null,
  pickupArea: o.pickup_area ?? null,
  dropoffArea: o.dropoff_area ?? null,
  itemCount: o.item_count ?? 0,
  status: o.status,
  slaDeadline: o.sla_deadline,
  createdAt: o.created_at,
});

const toDelivery = (d: any): Delivery => ({
  id: d.id,
  orderId: d.order_id,
  orderNumber: d.order_number,
  status: d.status,
  pickup: { name: d.pickup_name ?? null, address: d.pickup_address ?? null, lat: d.pickup_latitude ?? null, lng: d.pickup_longitude ?? null },
  dropoff: { area: d.dropoff_area ?? null, address: d.dropoff_address ?? null, lat: d.dropoff_latitude ?? null, lng: d.dropoff_longitude ?? null },
  customerName: d.customer_name ?? null,
  instructions: d.delivery_instructions ?? null,
  itemCount: d.item_count ?? 0,
  attemptCount: d.attempt_count ?? 0,
  failureReason: d.failure_reason ?? null,
  acceptedAt: d.accepted_at ?? null,
  arrivedAtPickupAt: d.arrived_at_pickup_at ?? null,
  pickedUpAt: d.picked_up_at ?? null,
  arrivedAtCustomerAt: d.arrived_at_customer_at ?? null,
  deliveredAt: d.delivered_at ?? null,
  createdAt: d.created_at,
});

const toEvent = (e: any): DeliveryEvent => ({
  event: e.event,
  fromStatus: e.from_status ?? null,
  toStatus: e.to_status ?? null,
  actor: e.actor_type,
  at: e.occurred_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const STEP_PATH: Record<DeliveryStep, (id: string) => string> = {
  "start-pickup": COURIER_ENDPOINTS.startPickup,
  "arrive-at-pickup": COURIER_ENDPOINTS.arriveAtPickup,
  "begin-pickup-verification": COURIER_ENDPOINTS.beginPickupVerification,
  "start-dropoff": COURIER_ENDPOINTS.startDropoff,
  "arrive-at-customer": COURIER_ENDPOINTS.arriveAtCustomer,
  "begin-delivery-verification": COURIER_ENDPOINTS.beginDeliveryVerification,
  "report-customer-unavailable": COURIER_ENDPOINTS.reportCustomerUnavailable,
  "fail-delivery": COURIER_ENDPOINTS.failDelivery,
  "start-return": COURIER_ENDPOINTS.startReturn,
  release: COURIER_ENDPOINTS.release,
};

/** Courier app (login required, courier role). */
export const courierService = {
  /** `null` when this account has no courier profile yet (404). */
  async me(): Promise<CourierProfile | null> {
    try {
      return toProfile(await apiFetch(COURIER_ENDPOINTS.me, { revalidate: false }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async createProfile(input: { vehicleType: string; plateNumber?: string }): Promise<CourierProfile> {
    return toProfile(
      await apiFetch(COURIER_ENDPOINTS.profile, {
        method: "POST",
        body: { vehicle_type: input.vehicleType.slice(0, 20), plate_number: input.plateNumber?.trim() || null },
      }),
    );
  },

  async setOnline(isOnline: boolean): Promise<CourierProfile> {
    return toProfile(await apiFetch(COURIER_ENDPOINTS.status, { method: "PATCH", body: { is_online: isOnline } }));
  },

  updateLocation: (latitude: number, longitude: number) =>
    apiFetch<unknown>(COURIER_ENDPOINTS.location, { method: "PATCH", body: { latitude, longitude } }),

  async pool(): Promise<DeliveryOffer[]> {
    const rows = await apiFetch<unknown[]>(COURIER_ENDPOINTS.pool, { revalidate: false });
    return (rows ?? []).map(toOffer).sort((a, b) => Date.parse(a.slaDeadline) - Date.parse(b.slaDeadline));
  },

  async claim(offerId: string): Promise<Delivery> {
    return toDelivery(await apiFetch(COURIER_ENDPOINTS.claimOffer(offerId), { method: "POST" }));
  },

  async active(): Promise<Delivery | null> {
    const row = await apiFetch<unknown>(COURIER_ENDPOINTS.activeDelivery, { revalidate: false });
    return row ? toDelivery(row) : null;
  },

  async history(limit = 30): Promise<Delivery[]> {
    const rows = await apiFetch<unknown[]>(COURIER_ENDPOINTS.history, { query: { limit }, revalidate: false });
    return (rows ?? []).map(toDelivery);
  },

  /** One delivery with its event log. */
  async detail(id: string): Promise<{ delivery: Delivery; events: DeliveryEvent[] }> {
    const res = await apiFetch<{ delivery: unknown; events: unknown[] }>(COURIER_ENDPOINTS.delivery(id), { revalidate: false });
    return { delivery: toDelivery(res.delivery), events: (res.events ?? []).map(toEvent) };
  },

  /** Moves the delivery one step through its state machine; `reason`/`note` explain failures. */
  async step(id: string, step: DeliveryStep, input: { reason?: string; note?: string } = {}): Promise<Delivery> {
    return toDelivery(
      await apiFetch(STEP_PATH[step](id), { method: "POST", body: { reason: input.reason || null, note: input.note || null } }),
    );
  },
};
