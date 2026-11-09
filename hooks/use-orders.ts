"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersService, type DeliveryProblemReason } from "@/services/orders.service";
import { paymentsService, type CheckoutSessionCreate } from "@/services/payments.service";
import { orderQueries, queryKeys } from "@/services/queries";
import { walletService } from "@/services/wallet.service";
import type { OrderCreate } from "@/types/api";
import type { Order } from "@/types/order";
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

/**
 * Every delivery action answers with the whole updated order, so each one seeds the detail cache
 * directly and only nudges the list — no refetch needed to see the new state.
 */
function useOrderAction<TInput>(mutationFn: (input: TInput) => Promise<Order>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.order(order.id), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

/** Confirms the order — or one vendor's package — arrived. */
export function useConfirmDelivery(orderId: string) {
  return useOrderAction((packageId: string | undefined) => ordersService.confirmDelivery(orderId, packageId));
}

export function useReportDeliveryProblem(orderId: string) {
  return useOrderAction((input: { reason: DeliveryProblemReason; details?: string; packageId?: string }) =>
    ordersService.reportDeliveryProblem(orderId, input),
  );
}

export function useRateDelivery(orderId: string) {
  return useOrderAction((rating: number) => ordersService.rateDelivery(orderId, rating));
}

export function useRescheduleDelivery(orderId: string) {
  return useOrderAction((input: { note?: string; packageId?: string }) => ordersService.reschedule(orderId, input));
}

/** Creates the order and its hosted payment session; the caller redirects to `authorization_url`. */
export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutSessionCreate) => paymentsService.checkout(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
  });
}

/**
 * Pays out of the ODOS Wallet. This settles on the spot rather than handing off to a provider, so
 * the order exists the moment it returns — and the wallet balance has moved.
 */
export function useWalletCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderCreate) => walletService.checkout(input),
    onSuccess: ({ order }) => {
      queryClient.setQueryData(queryKeys.order(order.id), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
    },
  });
}
