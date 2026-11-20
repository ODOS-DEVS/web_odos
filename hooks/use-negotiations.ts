"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { negotiationService } from "@/services/negotiation.service";

const keys = {
  all: ["negotiations"] as const,
  list: (role: string, status?: string) => ["negotiations", role, status ?? "all"] as const,
  counts: (role: string) => ["negotiations", "counts", role] as const,
  one: (id: string) => ["negotiations", "one", id] as const,
};

export function useNegotiations(role: "customer" | "vendor", status?: string) {
  const session = useSession();
  return useQuery({
    queryKey: keys.list(role, status),
    queryFn: () => negotiationService.list(role, status),
    enabled: Boolean(session),
  });
}

export function useNegotiationCounts(role: "customer" | "vendor") {
  const session = useSession();
  return useQuery({
    queryKey: keys.counts(role),
    queryFn: () => negotiationService.counts(role),
    enabled: Boolean(session),
  });
}

export function useNegotiation(id: string | undefined) {
  const session = useSession();
  return useQuery({
    queryKey: keys.one(id ?? ""),
    queryFn: () => negotiationService.one(id ?? ""),
    enabled: Boolean(session && id),
    // An agreement counts down, and the other side may move while this is open.
    refetchInterval: 30_000,
  });
}

/**
 * Every negotiation action shares one invalidation: a move changes the thread, both parties'
 * lists and their counts, and a stale badge on one of them is how a vendor misses an offer.
 */
function useNegotiationMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export const useStartNegotiation = () =>
  useNegotiationMutation(negotiationService.start);

export const useCounterOffer = () =>
  useNegotiationMutation(({ id, ...input }: { id: string; unitPrice: number; quantity?: number; message?: string | null }) =>
    negotiationService.counter(id, input),
  );

export const useAcceptOffer = () =>
  useNegotiationMutation(({ id }: { id: string }) => negotiationService.accept(id));

export const useRejectOffer = () =>
  useNegotiationMutation(({ id, message }: { id: string; message?: string | null }) =>
    negotiationService.reject(id, message),
  );

export const useWithdrawOffer = () =>
  useNegotiationMutation(({ id }: { id: string }) => negotiationService.withdraw(id));
