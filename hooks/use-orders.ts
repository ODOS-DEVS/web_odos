"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersService } from "@/services/orders.service";
import type { Order } from "@/types/order";
import { paymentsService, type CheckoutSessionCreate, type WalletCheckoutCreate } from "@/services/payments.service";
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

/** Places and pays the order from the ODOS Wallet in one call. */
export function useWalletCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WalletCheckoutCreate) => paymentsService.walletCheckout(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useWalletBalance() {
  const session = useSession();
  return useQuery({ queryKey: ["wallet", "balance"], queryFn: () => paymentsService.walletBalance(), enabled: Boolean(session) });
}

export function useCheckoutAddresses() {
  const session = useSession();
  return useQuery({
    queryKey: ["account", "addresses"],
    queryFn: () => paymentsService.addresses(),
    enabled: Boolean(session),
    staleTime: 5 * 60_000,
  });
}

/**
 * Confirms a hosted payment with the API (never trusting the redirect alone). A mobile-money payment
 * can still be settling when the shopper lands back, so a pending result is re-checked every few seconds.
 */
export function usePaymentVerification(reference: string | undefined) {
  const session = useSession();
  return useQuery({
    queryKey: ["payments", "verify", reference ?? ""],
    queryFn: () => paymentsService.verify(reference!),
    enabled: Boolean(reference && session),
    refetchInterval: (query) => (query.state.data?.pending && query.state.dataUpdateCount < 20 ? 3_000 : false),
    retry: 1,
  });
}

/**
 * Shopper actions on a delivered / in-transit order (confirm receipt, report a problem, reschedule,
 * rate). Each returns the updated order, which replaces the cached copy straight away.
 */
export function useOrderActions(orderId: string) {
  const queryClient = useQueryClient();
  const onSuccess = (order: Order) => {
    queryClient.setQueryData(queryKeys.order(order.id), order);
    queryClient.invalidateQueries({ queryKey: queryKeys.orders });
  };
  return {
    confirmDelivery: useMutation({ mutationFn: () => ordersService.confirmDelivery(orderId), onSuccess }),
    confirmPackage: useMutation({ mutationFn: (packageId: string) => ordersService.confirmPackage(orderId, packageId), onSuccess }),
    reportProblem: useMutation({
      mutationFn: (input: { reason: string; details?: string; packageId?: string }) => ordersService.reportProblem(orderId, input),
      onSuccess,
    }),
    reschedule: useMutation({
      mutationFn: (input: { note?: string; packageId?: string }) => ordersService.requestReschedule(orderId, input),
      onSuccess,
    }),
    rate: useMutation({ mutationFn: (rating: number) => ordersService.rateDelivery(orderId, rating), onSuccess }),
  };
}
