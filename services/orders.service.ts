import { ORDERS_ENDPOINTS } from "@/libs/api-endpoint";
import type { OrderCreate, OrderRead } from "@/types/api";
import type { Order } from "@/types/order";
import { apiFetch } from "./http";
import { toOrder } from "./mappers";

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

  /** The shopper confirms the whole order arrived (releases payment to the vendors). */
  async confirmDelivery(id: string): Promise<Order> {
    return toOrder(await apiFetch<OrderRead>(ORDERS_ENDPOINTS.deliver(id), { method: "PATCH" }));
  },

  /** Confirms one vendor's package arrived; other packages keep their own status. */
  async confirmPackage(id: string, packageId: string): Promise<Order> {
    return toOrder(await apiFetch<OrderRead>(ORDERS_ENDPOINTS.deliverPackage(id, packageId), { method: "PATCH" }));
  },

  /** `reason` is a short label (≤40 characters); `packageId` narrows it to one vendor's package. */
  async reportProblem(id: string, input: { reason: string; details?: string; packageId?: string }): Promise<Order> {
    return toOrder(
      await apiFetch<OrderRead>(ORDERS_ENDPOINTS.deliveryProblem(id), {
        method: "POST",
        body: { reason: input.reason.slice(0, 40), details: input.details || null, package_id: input.packageId ?? null },
      }),
    );
  },

  async requestReschedule(id: string, input: { note?: string; packageId?: string }): Promise<Order> {
    return toOrder(
      await apiFetch<OrderRead>(ORDERS_ENDPOINTS.reschedule(id), {
        method: "POST",
        body: { note: input.note || null, package_id: input.packageId ?? null },
      }),
    );
  },

  async rateDelivery(id: string, rating: number): Promise<Order> {
    return toOrder(
      await apiFetch<OrderRead>(ORDERS_ENDPOINTS.deliveryRating(id), { method: "PATCH", body: { rating: Math.round(rating) } }),
    );
  },
};
