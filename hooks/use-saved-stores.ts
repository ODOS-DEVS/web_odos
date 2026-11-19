"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { savedStoreService } from "@/services/saved-store.service";
import type { SavedStore } from "@/types/catalog";

const KEY = ["saved-stores"] as const;

/**
 * Stores the signed-in shopper kept.
 *
 * Disabled while signed out rather than returning an empty list from localStorage: saves live
 * on the account, so a guest has none to show and the UI should ask them to sign in instead of
 * quietly pretending the list is empty.
 */
export function useSavedStores() {
  const session = useSession();
  return useQuery({
    queryKey: KEY,
    queryFn: () => savedStoreService.list(),
    enabled: Boolean(session),
  });
}

export function useIsStoreSaved(storeId: string | undefined) {
  const { data } = useSavedStores();
  return Boolean(storeId && data?.some((row) => row.store.id === storeId));
}

/**
 * Save or unsave, with the button flipping immediately.
 *
 * Optimistic because the round trip is long enough to feel broken on a tap, and the server is
 * idempotent in both directions — so a failed save rolls back to exactly the state the cache
 * already held rather than guessing.
 */
export function useToggleSavedStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, saved }: { storeId: string; saved: boolean }) => {
      if (saved) await savedStoreService.remove(storeId);
      else await savedStoreService.save(storeId);
    },

    onMutate: async ({ storeId, saved }) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<SavedStore[]>(KEY);
      if (previous && saved) {
        queryClient.setQueryData<SavedStore[]>(
          KEY,
          previous.filter((row) => row.store.id !== storeId),
        );
      }
      return { previous };
    },

    onError: (_error, _variables, context: { previous?: SavedStore[] } | undefined) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },

    // Always re-read: a save needs the server's store payload (and its verified flag), which
    // the optimistic path has no way to invent.
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
