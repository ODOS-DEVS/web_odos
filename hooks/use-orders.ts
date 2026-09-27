"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersService } from "@/services/orders.service";
import { paymentsService, type CheckoutSessionCreate } from "@/services/payments.service";
import { orderQueries, queryKeys } from "@/services/queries";
import { useSession } from "./use-auth";

/** Orders are private: the queries stay disabled until there is a session. */
export function useOrders() {
  const session = useSession();
  return useQuery({ ...orderQueries.list(), enabled: Boolean(session) });
}

export function useOrder(id: string) {
  const session = useSession();
  return useQuery({ ...orderQueries.detail(id), enabled: Boolean(session) });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersService.cancel(id),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.order(order.id), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

/** Creates the order and its hosted payment session; the caller redirects to `authorization_url`. */
export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutSessionCreate) => paymentsService.checkout(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
  });
}
