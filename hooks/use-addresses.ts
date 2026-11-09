"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountService, type AddressInput } from "@/services/account.service";
import { accountQueries, queryKeys } from "@/services/queries";
import type { SavedAddress } from "@/types/account";
import { useSession } from "./use-auth";

export type { SavedAddress };

type Options = { onSuccess?: () => void; onError?: (error: unknown) => void };

/**
 * The shopper's saved delivery addresses, on the account rather than in this browser — so they are
 * there on their phone too. `ready` is false until the list has actually arrived.
 */
export function useAddresses() {
  const session = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({ ...accountQueries.addresses(), enabled: Boolean(session) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses });

  const create = useMutation({ mutationFn: (input: AddressInput) => accountService.createAddress(input), onSuccess: invalidate });
  const patch = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddressInput }) => accountService.updateAddress(id, input),
    onSuccess: invalidate,
  });
  const destroy = useMutation({ mutationFn: (id: string) => accountService.deleteAddress(id), onSuccess: invalidate });
  // Promoting one address demotes the others server-side, so the whole list is refetched.
  const makeDefault = useMutation({ mutationFn: (id: string) => accountService.setDefaultAddress(id), onSuccess: invalidate });

  return {
    ready: Boolean(session) && query.isSuccess,
    addresses: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isSaving: create.isPending || patch.isPending,
    add: (input: AddressInput, options?: Options) => create.mutate(input, options),
    update: (id: string, input: AddressInput, options?: Options) => patch.mutate({ id, input }, options),
    remove: (id: string, options?: Options) => destroy.mutate(id, options),
    setDefault: (id: string, options?: Options) => makeDefault.mutate(id, options),
  };
}
