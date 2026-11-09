import { ORDERS_ENDPOINTS } from "@/libs/api-endpoint";
import type { OrderCreate, OrderRead } from "@/types/api";
import type { Order } from "@/types/order";
import type { ReturnRequestType } from "@/types/returns";
import { apiFetch } from "./http";
import { toOrder } from "./mappers";

/** The reasons the backend's delivery-problem form accepts, matching the mobile app's sheet. */
export const DELIVERY_PROBLEM_REASONS = [
  { value: "rider_no_show", label: "Rider didn't arrive" },
  { value: "not_available", label: "I wasn't available" },
  { value: "wrong_delivery", label: "Wrong delivery" },
  { value: "order_issue", label: "Something's wrong with the order" },
  { value: "other", label: "Other" },
] as const;

export type DeliveryProblemReason = (typeof DELIVERY_PROBLEM_REASONS)[number]["value"];

export type ReturnInput = {
  orderItemId: string;
  type: ReturnRequestType;
  quantity: number;
  reason: string;
  details?: string;
  images?: File[];
};

export const ordersService = {
  async list(): Promise<Order[]> {
    const rows = await apiFetch<OrderRead[]>(ORDERS_ENDPOINTS.orders, { revalidate: false });
    return rows.map(toOrder).sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt));
  },

  async get(id: string): Promise<Order> {
    return toOrder(await apiFetch<OrderRead>(ORDERS_ENDPOINTS.order(id), { revalidate: false }));
  },

  /** Creates an order without a payment session (e.g. wallet or pay-later flows). */
  async create(input: OrderCreate): Promise<Order> {
    return toOrder(await apiFetch<OrderRead>(ORDERS_ENDPOINTS.orders, { method: "POST", body: input }));
  },

  async cancel(id: string): Promise<Order> {
    return toOrder(await apiFetch<OrderRead>(ORDERS_ENDPOINTS.cancel(id), { method: "PATCH" }));
  },

  /**
   * Confirms the goods arrived. With a `packageId` it settles just that vendor's bag — a separate
   * path on the API precisely so one call cannot accidentally settle every vendor on the order.
   */
  async confirmDelivery(orderId: string, packageId?: string): Promise<Order> {
    const path = packageId
      ? ORDERS_ENDPOINTS.deliverPackage(orderId, packageId)
      : ORDERS_ENDPOINTS.deliver(orderId);
    return toOrder(await apiFetch<OrderRead>(path, { method: "PATCH" }));
  },

  /**
   * Reports that something went wrong. Scoping it to a package scopes the settlement hold too, so
   * reporting one missing bag does not freeze money owed to a vendor who delivered on time.
   */
  async reportDeliveryProblem(
    orderId: string,
    input: { reason: DeliveryProblemReason; details?: string; packageId?: string },
  ): Promise<Order> {
    return toOrder(
      await apiFetch<OrderRead>(ORDERS_ENDPOINTS.deliveryProblem(orderId), {
        method: "POST",
        body: {
          reason: input.reason,
          details: input.details?.trim() || null,
          package_id: input.packageId ?? null,
        },
      }),
    );
  },

  /** Rates the delivery 1–5. The API rejects anything outside that range. */
  async rateDelivery(orderId: string, rating: number): Promise<Order> {
    return toOrder(
      await apiFetch<OrderRead>(ORDERS_ENDPOINTS.deliveryRating(orderId), {
        method: "PATCH",
        body: { rating },
      }),
    );
  },

  /** Asks for another delivery attempt. Omitting the package means everything currently out. */
  async reschedule(orderId: string, input: { note?: string; packageId?: string } = {}): Promise<Order> {
    return toOrder(
      await apiFetch<OrderRead>(ORDERS_ENDPOINTS.reschedule(orderId), {
        method: "POST",
        body: { note: input.note?.trim() || null, package_id: input.packageId ?? null },
      }),
    );
  },

  /**
   * Files a return/exchange/refund against one line of a delivered order. The endpoint takes
   * multipart (evidence photos go up with it, under a repeated `images` field).
   */
  createReturn(orderId: string, input: ReturnInput) {
    const form = new FormData();
    form.append("order_item_id", input.orderItemId);
    form.append("request_type", input.type);
    form.append("quantity", String(input.quantity));
    form.append("reason", input.reason);
    if (input.details?.trim()) form.append("details", input.details.trim());
    for (const file of input.images ?? []) form.append("images", file);

    return apiFetch<unknown>(ORDERS_ENDPOINTS.returns(orderId), { method: "POST", body: form, revalidate: false });
  },
};
