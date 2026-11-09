"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountService, type PaymentMethodInput } from "@/services/account.service";
import { accountQueries, queryKeys } from "@/services/queries";
import type { SavedPaymentMethod } from "@/types/account";
import { useSession } from "./use-auth";

export type { SavedPaymentMethod };

type Options = { onSuccess?: () => void; onError?: (error: unknown) => void };

/**
 * The shopper's saved momo wallets and cards, on the account rather than in this browser — the same
 * list their phone shows. `ready` is false until it has arrived.
 */
export function usePaymentMethods() {
  const session = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({ ...accountQueries.paymentMethods(), enabled: Boolean(session) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });

  const create = useMutation({ mutationFn: (input: PaymentMethodInput) => accountService.createPaymentMethod(input), onSuccess: invalidate });
  const destroy = useMutation({ mutationFn: (id: string) => accountService.deletePaymentMethod(id), onSuccess: invalidate });
  // Promoting one demotes the rest server-side, so the whole list is refetched.
  const makeDefault = useMutation({ mutationFn: (id: string) => accountService.setDefaultPaymentMethod(id), onSuccess: invalidate });

  return {
    ready: Boolean(session) && query.isSuccess,
    methods: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isSaving: create.isPending,
    add: (input: PaymentMethodInput, options?: Options) => create.mutate(input, options),
    remove: (id: string, options?: Options) => destroy.mutate(id, options),
    setDefault: (id: string, options?: Options) => makeDefault.mutate(id, options),
  };
}
