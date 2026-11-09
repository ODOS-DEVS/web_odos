"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { chatQueries, queryKeys } from "@/services/queries";
import { useSession } from "./use-auth";

/** How often an open conversation re-checks for a vendor reply. There are no websockets on the API. */
const MESSAGE_POLL_MS = 15_000;

/** Every conversation the shopper has, newest activity first. */
export function useChatThreads() {
  const session = useSession();
  const query = useQuery({ ...chatQueries.threads(), enabled: Boolean(session) });
  const threads = query.data ?? [];

  return {
    ready: Boolean(session) && query.isSuccess,
    threads,
    unreadCount: threads.reduce((total, thread) => total + thread.unreadCount, 0),
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Opens the conversation with a vendor. "Ensure" is idempotent on the API, so this runs on every
 * mount and either creates the thread or hands back the existing one.
 */
export function useStoreThread(storeId: string | undefined) {
  const session = useSession();
  return useQuery({
    ...chatQueries.storeThread(storeId ?? ""),
    enabled: Boolean(session && storeId),
  });
}

/** Messages in a thread, polled while the conversation is on screen. */
export function useChatMessages(threadId: string | undefined) {
  const session = useSession();
  return useQuery({
    ...chatQueries.messages(threadId ?? ""),
    enabled: Boolean(session && threadId),
    refetchInterval: threadId ? MESSAGE_POLL_MS : false,
  });
}

export function useSendMessage(threadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => {
      if (!threadId) throw new Error("The conversation is still opening. Please try again.");
      return chatService.send(threadId, text);
    },
    onSuccess: () => {
      if (threadId) queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(threadId) });
      // The thread list shows the last message and unread counts, so it moves too.
      queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads });
    },
  });
}
