"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { queryKeys } from "@/services/queries";
import { returnsService } from "@/services/returns.service";
import type { ReturnRequestRead } from "@/types/api";
import type { Order } from "@/types/order";
import type {
  ReturnEligibleItem,
  ReturnRequest,
  ReturnRequestStatus,
  ReturnRequestType,
} from "@/types/returns";
import { useMounted } from "./use-mounted";
import { useOrders } from "./use-orders";

export type SubmitReturnInput = {
  orderId: string;
  itemId: string;
  type: ReturnRequestType;
  quantity: number;
  reason: string;
  details: string;
  photoNames?: string[];
  photoUrls?: string[];
};

type ReturnsState = {
  requests: ReturnRequest[];
  saveLocal: (input: SubmitReturnInput) => ReturnRequest;
};

const useReturnsStore = create<ReturnsState>()(
  persist(
    (set, get) => ({
      requests: [],
      saveLocal: (input) => {
        const request: ReturnRequest = {
          id: crypto.randomUUID(),
          orderId: input.orderId,
          itemId: input.itemId,
          type: input.type,
          quantity: input.quantity,
          reason: input.reason,
          details: input.details,
          photoNames: input.photoNames ?? [],
          photoUrls: input.photoUrls ?? [],
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        set({
          requests: [
            request,
            ...get().requests.filter((r) => r.itemId !== input.itemId),
          ],
        });
        return request;
      },
    }),
    { name: "odos-returns-v1" },
  ),
);

function mapBackendReturnRequest(r: ReturnRequestRead): ReturnRequest {
  const normStatus = (r.status?.toLowerCase() ?? "pending") as ReturnRequestStatus;
  const status: ReturnRequestStatus =
    normStatus === "approved" || normStatus === "rejected" ? normStatus : "pending";

  const normType = (r.request_type?.toLowerCase() ?? "refund") as ReturnRequestType;
  const type: ReturnRequestType =
    normType === "exchange" || normType === "return" ? normType : "refund";

  return {
    id: r.id,
    orderId: r.order_id,
    itemId: r.order_item_id,
    type,
    quantity: r.quantity ?? 1,
    reason: r.reason ?? "Return requested",
    details: r.details ?? "",
    photoNames: [],
    photoUrls: r.evidence_image_urls ?? [],
    status,
    createdAt: r.created_at,
  };
}

/** Extracts items from packages whose status is "delivered". */
export function extractReturnEligibleItems(orders: Order[] | undefined): ReturnEligibleItem[] {
  if (!orders) return [];
  const items: ReturnEligibleItem[] = [];
  for (const order of orders) {
    for (const pkg of order.packages) {
      if (pkg.status !== "delivered") continue;
      const deliveredAt = order.timeline.find((t) => t.label === "Delivered")?.at ?? order.placedAt;
      for (const item of pkg.items) {
        const variantParts = [item.color, item.size].filter(Boolean);
        items.push({
          id: item.id,
          orderId: order.id,
          orderNumber: order.number,
          productId: item.productId,
          name: item.name,
          imageUrl: item.imageUrl,
          variant: variantParts.length > 0 ? variantParts.join(" · ") : "Standard",
          deliveredAt,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }
    }
  }
  return items;
}

/** The shopper's filed return/exchange/refund requests wired to the backend with fallback. */
export function useReturns() {
  const ready = useMounted();
  const queryClient = useQueryClient();
  const { data: orders } = useOrders();

  const storedRequests = useReturnsStore((s) => s.requests);
  const saveLocal = useReturnsStore((s) => s.saveLocal);

  const mutation = useMutation({
    mutationFn: async (input: SubmitReturnInput) => {
      try {
        const backendRes = await returnsService.create(input.orderId, {
          order_item_id: input.itemId,
          request_type: input.type,
          quantity: input.quantity,
          reason: input.reason,
          details: input.details,
          evidence_image_urls: input.photoUrls ?? [],
        });
        const mapped = mapBackendReturnRequest(backendRes);
        // Also save to local store so it is immediately cached
        saveLocal(input);
        return mapped;
      } catch {
        // Fallback to local store
        return saveLocal(input);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });

  const requests = useMemo(() => {
    if (!ready) return [];
    const fromOrders: ReturnRequest[] = [];
    if (orders) {
      for (const o of orders) {
        if (Array.isArray(o.returnRequests)) {
          for (const rr of o.returnRequests) {
            fromOrders.push(mapBackendReturnRequest(rr));
          }
        }
      }
    }

    // Merge backend requests and locally saved requests
    const combined = [...fromOrders];
    for (const local of storedRequests) {
      if (!combined.some((r) => r.itemId === local.itemId)) {
        combined.push(local);
      }
    }
    return combined;
  }, [ready, orders, storedRequests]);

  return {
    ready,
    requests,
    submit: (input: SubmitReturnInput) => mutation.mutate(input),
    submitAsync: (input: SubmitReturnInput) => mutation.mutateAsync(input),
    isSubmitting: mutation.isPending,
  };
}

/** The most recent request filed against a given eligible item, if any. */
export function useReturnRequestForItem(itemId: string) {
  const { requests, ready } = useReturns();
  return useMemo(() => {
    if (!ready) return undefined;
    return requests.find((r) => r.itemId === itemId);
  }, [requests, itemId, ready]);
}
