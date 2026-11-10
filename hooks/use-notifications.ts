"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications.service";
import { notificationQueries, queryKeys } from "@/services/queries";
import { useSession } from "./use-auth";

/** The shopper's notifications and unread badge count. Private, so it waits for a session. */
export function useNotifications() {
  const session = useSession();
  const query = useQuery({ ...notificationQueries.list(), enabled: Boolean(session) });

  return {
    notifications: query.data?.items ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { keys?: string[]; markAll?: boolean }) => notificationsService.markRead(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
