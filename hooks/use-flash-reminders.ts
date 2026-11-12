"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { catalogService } from "@/services/catalog.service";
import { queryKeys } from "@/services/queries";

/** The signed-in shopper's notify-me set; empty (and not fetched) when logged out. */
export function useFlashReminders() {
  const session = useSession();
  const query = useQuery({
    queryKey: queryKeys.myFlashReminders,
    queryFn: () => catalogService.myFlashReminders(),
    enabled: Boolean(session),
    staleTime: 60 * 1000,
  });
  return { ids: new Set(query.data ?? []), isReady: !session || !query.isPending };
}

export function useToggleFlashReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, on }: { eventId: string; on: boolean }) =>
      on ? catalogService.setFlashReminder(eventId) : catalogService.unsetFlashReminder(eventId),
    // The set is tiny, so a refetch is cheaper than cache surgery.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myFlashReminders }),
  });
}
