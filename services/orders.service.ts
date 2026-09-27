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
};
