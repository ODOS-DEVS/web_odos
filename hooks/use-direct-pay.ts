"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { directPayService } from "@/services/direct-pay.service";
import { useSession } from "./use-auth";

export function useDirectPayMethods(enabled = true) {
  const session = useSession();
  return useQuery({
    queryKey: ["payment-methods", "available"],
    queryFn: () => directPayService.available(),
    enabled: Boolean(session) && enabled,
    staleTime: 5 * 60_000,
  });
}

/** Refreshes the order (and lists) once a payment settles. */
function useRefreshOrders() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["orders"] });
}

export function useInitiateDirectPay() {
  const refresh = useRefreshOrders();
  return useMutation({
    mutationFn: ({ orderId, provider, phone }: { orderId: string; provider: string; phone?: string | null }) =>
      directPayService.initiate(orderId, provider, phone),
    onSuccess: (result) => result.paid && refresh(),
  });
}

export function useVerifyDirectPay() {
  const refresh = useRefreshOrders();
  return useMutation({
    mutationFn: ({ orderId, provider, reference }: { orderId: string; provider: string; reference?: string | null }) =>
      directPayService.verify(orderId, provider, reference),
    onSuccess: (result) => (result.paid || result.failed) && refresh(),
  });
}
