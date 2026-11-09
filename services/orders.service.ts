import { ORDERS_ENDPOINTS } from "@/libs/api-endpoint";
import type { OrderCreate, OrderRead } from "@/types/api";
import type { Order } from "@/types/order";
import type { ReturnRequestType } from "@/types/returns";
import { apiFetch } from "./http";
import { toOrder } from "./mappers";

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
