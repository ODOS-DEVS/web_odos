"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersService, type ReturnInput } from "@/services/orders.service";
import { queryKeys } from "@/services/queries";
import type { ReturnRequest } from "@/types/returns";
import { useOrders } from "./use-orders";

/**
 * The shopper's filed return requests. These travel with the order itself
 * (`OrderRead.return_requests`), so there is no separate list endpoint to call — and no local copy
 * that could disagree with what the vendor sees.
 */
export function useReturns() {
  const orders = useOrders();
  const queryClient = useQueryClient();

  const requests = useMemo<ReturnRequest[]>(
    () =>
      (orders.data ?? [])
        .flatMap((order) => order.returnRequests)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [orders.data],
  );

  const submit = useMutation({
    mutationFn: ({ orderId, ...input }: ReturnInput & { orderId: string }) => ordersService.createReturn(orderId, input),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    },
  });

  return {
    ready: orders.isSuccess,
    requests,
    isPending: orders.isPending,
    submit,
  };
}

/** The most recent request filed against a given order line, if any. */
export function useReturnRequestForItem(itemId: string): ReturnRequest | undefined {
  const { requests } = useReturns();
  return requests.find((r) => r.itemId === itemId);
}
