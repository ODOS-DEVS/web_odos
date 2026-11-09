import { ORDERS_ENDPOINTS } from "@/libs/api-endpoint";
import type { ReturnRequestCreate, ReturnRequestRead } from "@/types/api";
import { apiFetch } from "./http";

export const returnsService = {
  /**
   * Files a return, refund, or exchange request for an item in a delivered order.
   * Calls POST /orders/{order_id}/returns
   */
  async create(orderId: string, input: ReturnRequestCreate): Promise<ReturnRequestRead> {
    const body = {
      order_item_id: input.order_item_id,
      orderItemId: input.order_item_id,
      request_type: input.request_type,
      requestType: input.request_type,
      type: input.request_type,
      quantity: input.quantity,
      reason: input.reason,
      details: input.details ?? "",
      evidence_image_urls: input.evidence_image_urls ?? [],
      photo_urls: input.evidence_image_urls ?? [],
    };
    return apiFetch<ReturnRequestRead>(ORDERS_ENDPOINTS.returns(orderId), {
      method: "POST",
      body,
    });
  },
};

