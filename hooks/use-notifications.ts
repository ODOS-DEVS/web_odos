"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { notificationsService, type NotificationPage } from "@/services/notifications.service";
import { useSession } from "./use-auth";

const KEY = ["notifications"] as const;
const PAGE_SIZE = 20;
const POLL_MS = 60_000;

/** The latest few notifications plus the unread count, for the header bell. Polls once a minute. */
export function useNotificationsPreview(limit = 8) {
  const session = useSession();
  return useQuery({
    queryKey: [...KEY, "preview", limit],
    queryFn: () => notificationsService.page(limit, 0),
    enabled: Boolean(session),
    refetchInterval: POLL_MS,
    staleTime: 20_000,
  });
}

/** The full, paged list (GET /notifications?limit&offset) for the notifications page. */
export function useNotificationsList() {
  const session = useSession();
  return useInfiniteQuery({
    queryKey: [...KEY, "list"],
    queryFn: ({ pageParam }) => notificationsService.page(PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length * PAGE_SIZE : undefined),
    enabled: Boolean(session),
  });
}

/** Marks some (or all) notifications read, updating every cached list right away. */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { keys?: string[]; all?: boolean }) => notificationsService.markRead(input),
    onMutate: ({ keys = [], all }) => {
      const mark = (page: NotificationPage): NotificationPage => {
        const items = page.items.map((n) => (all || keys.includes(n.id) ? { ...n, read: true } : n));
        const newlyRead = page.items.filter((n) => !n.read && (all || keys.includes(n.id))).length;
        return { ...page, items, unread: all ? 0 : Math.max(0, page.unread - newlyRead) };
      };
      queryClient.setQueriesData<NotificationPage>({ queryKey: [...KEY, "preview"] }, (prev) => (prev ? mark(prev) : prev));
      queryClient.setQueriesData<InfiniteData<NotificationPage>>({ queryKey: [...KEY, "list"] }, (prev) =>
        prev ? { ...prev, pages: prev.pages.map(mark) } : prev,
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

/** Saves or clears the account's Expo push token (used by the mobile app; exposed for completeness). */
export function usePushToken() {
  return {
    save: useMutation({ mutationFn: (token: string) => notificationsService.savePushToken(token) }),
    clear: useMutation({ mutationFn: () => notificationsService.clearPushToken() }),
  };
}
