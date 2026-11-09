"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountQueries, queryKeys } from "@/services/queries";
import { addressesService } from "@/services/addresses.service";
import { useMounted } from "./use-mounted";

export type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  isDefault?: boolean;
};

/**
 * Connected directly to GET /account/addresses with React Query caching and mutations.
 * Strictly presents genuine backend address records.
 */
export function useAddresses() {
  const ready = useMounted();
  const queryClient = useQueryClient();

  const query = useQuery({
    ...accountQueries.addresses(),
    enabled: ready,
    retry: 1,
  });

  const addMutation = useMutation({
    mutationFn: async (draft: Omit<SavedAddress, "id">) => {
      return await addressesService.create(draft);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: Omit<SavedAddress, "id"> }) => {
      return await addressesService.update(id, draft);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await addressesService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return await addressesService.setDefault(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
    },
  });

  const addresses = query.data ?? [];

  return {
    ready,
    isLoading: query.isLoading,
    isError: query.isError,
    addresses,
    add: (draft: Omit<SavedAddress, "id">) => addMutation.mutate(draft),
    addAsync: (draft: Omit<SavedAddress, "id">) => addMutation.mutateAsync(draft),
    update: (id: string, draft: Omit<SavedAddress, "id">) => updateMutation.mutate({ id, draft }),
    updateAsync: (id: string, draft: Omit<SavedAddress, "id">) => updateMutation.mutateAsync({ id, draft }),
    remove: (id: string) => removeMutation.mutate(id),
    setDefault: (id: string) => setDefaultMutation.mutate(id),
    isSaving: addMutation.isPending || updateMutation.isPending,
  };
}
