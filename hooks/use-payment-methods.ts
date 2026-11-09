"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountQueries, queryKeys } from "@/services/queries";
import {
  paymentMethodsService,
  type SavedPaymentMethod,
} from "@/services/payment-methods.service";
import type { SavedPaymentMethodCreate } from "@/types/api";
import { useMounted } from "./use-mounted";

export type { SavedPaymentMethod };

/**
 * Connected directly to GET /account/payment-methods with React Query caching and mutations.
 * Strictly presents genuine backend records.
 */
export function usePaymentMethods() {
  const ready = useMounted();
  const queryClient = useQueryClient();

  const query = useQuery({
    ...accountQueries.paymentMethods(),
    enabled: ready,
    retry: 1,
  });

  const addMutation = useMutation({
    mutationFn: async (payload: SavedPaymentMethodCreate) => {
      return await paymentMethodsService.create(payload);
    },
    onSuccess: (newMethod) => {
      queryClient.setQueryData(accountQueries.paymentMethods().queryKey, (old: SavedPaymentMethod[] = []) => [
        ...old.filter((m) => m.id !== newMethod.id),
        newMethod,
      ]);
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await paymentMethodsService.delete(id);
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData(accountQueries.paymentMethods().queryKey, (old: SavedPaymentMethod[] = []) =>
        old.filter((m) => m.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return await paymentMethodsService.setDefault(id);
    },
    onSuccess: (updatedMethod) => {
      queryClient.setQueryData(accountQueries.paymentMethods().queryKey, (old: SavedPaymentMethod[] = []) =>
        old.map((m) => ({ ...m, isDefault: m.id === updatedMethod.id }))
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: SavedPaymentMethodCreate }) => {
      return await paymentMethodsService.update(id, payload);
    },
    onSuccess: (updatedMethod) => {
      queryClient.setQueryData(accountQueries.paymentMethods().queryKey, (old: SavedPaymentMethod[] = []) =>
        old.map((m) => (m.id === updatedMethod.id ? updatedMethod : m))
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });
    },
  });

  const methods = query.data ?? [];

  return {
    ready,
    isLoading: !ready || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    methods,
    add: (payload: SavedPaymentMethodCreate) => addMutation.mutate(payload),
    addAsync: (payload: SavedPaymentMethodCreate) => addMutation.mutateAsync(payload),
    update: (id: string, payload: SavedPaymentMethodCreate) => updateMutation.mutate({ id, payload }),
    updateAsync: (id: string, payload: SavedPaymentMethodCreate) => updateMutation.mutateAsync({ id, payload }),
    remove: (id: string) => removeMutation.mutate(id),
    setDefault: (id: string) => setDefaultMutation.mutate(id),
    isSaving: addMutation.isPending || updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
