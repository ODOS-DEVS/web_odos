"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService, isSupportThread, type ChatMessage } from "@/services/chat.service";
import { queryKeys } from "@/services/queries";
import type { Store } from "@/types/catalog";
import { useSession } from "./use-auth";
import { useStoreMap } from "./use-catalog";

export type ChatThreadSummary = { id: string; store: Store; lastMessage: string; updatedAt: string; unread: boolean };

/** How often an open conversation checks for new messages (there is no push channel for the web). */
const MESSAGE_POLL_MS = 5_000;
const THREAD_POLL_MS = 30_000;

/** A minimal `Store` for a thread whose vendor isn't in the cached store list. */
function storeFromThread(id: string, name: string, imageUrl: string | null): Store {
  return {
    id,
    slug: id,
    name,
    category: "",
    description: "",
    logoUrl: imageUrl,
    bannerUrl: null,
    rating: 0,
    city: null,
    region: null,
    address: null,
    phone: null,
    email: null,
    whatsappUrl: null,
    deliveryBadge: null,
    deliveryFeeFrom: null,
    isOnVacation: false,
    vacationMessage: null,
    marketSlug: null,
  };
}

/** The shopper's vendor conversations (GET /chat/threads), newest first. Empty for guests. */
export function useChatThreads() {
  const session = useSession();
  const queryClient = useQueryClient();
  const { map: stores } = useStoreMap();
  const query = useQuery({
    queryKey: queryKeys.chatThreads,
    queryFn: () => chatService.threads(),
    enabled: Boolean(session),
    refetchInterval: THREAD_POLL_MS,
  });

  const threads = useMemo<ChatThreadSummary[]>(
    () =>
      // The support thread has its own screen (Account → Help & support), so keep it out of the vendor inbox.
      (query.data ?? []).filter((t) => !isSupportThread(t)).map((t) => ({
        id: t.id,
        store: stores.get(t.storeId) ?? storeFromThread(t.storeId, t.storeName, t.storeImageUrl),
        lastMessage: t.lastMessage ?? "No messages yet",
        updatedAt: t.updatedAt,
        unread: t.unreadCount > 0,
      })),
    [query.data, stores],
  );

  const unreadCount = threads.filter((t) => t.unread).length;

  /** Opening a thread fetches its messages, which marks them read on the server; refresh the badges. */
  const markRead = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_slug?: string) => void queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads }),
    [queryClient],
  );

  return { ready: !session || query.isSuccess, threads, unreadCount, markRead, query };
}

/**
 * One conversation with a store: opens (or creates) the thread, polls its messages, and sends new ones.
 * `productId` attaches the product the shopper came from when the thread is first created.
 */
export function useStoreChat(storeId: string, productId?: string) {
  const session = useSession();
  const myUserId = session?.user.id ?? null;
  const queryClient = useQueryClient();

  const thread = useQuery({
    queryKey: queryKeys.chatStoreThread(storeId, productId),
    queryFn: () => chatService.ensureStoreThread(storeId, productId ? { product_id: productId } : undefined),
    enabled: Boolean(session),
    staleTime: Infinity,
  });
  const threadId = thread.data?.id;

  const messages = useQuery({
    queryKey: queryKeys.chatMessages(threadId ?? ""),
    queryFn: () => chatService.messages(threadId!, myUserId),
    enabled: Boolean(threadId),
    refetchInterval: MESSAGE_POLL_MS,
  });

  const send = useMutation({
    mutationFn: (text: string) => chatService.send(threadId!, text, myUserId),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessage[]>(queryKeys.chatMessages(threadId ?? ""), (prev = []) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads });
    },
  });

  return { thread, messages, send };
}

const SUPPORT_THREAD_KEY = ["chat", "support-thread"] as const;

/** The shopper's ODOS support conversation: ensures the thread, polls messages, sends, resolves/reopens. */
export function useSupportChat(enabled = true) {
  const session = useSession();
  const myUserId = session?.user.id ?? null;
  const queryClient = useQueryClient();

  const thread = useQuery({
    queryKey: SUPPORT_THREAD_KEY,
    queryFn: () => chatService.ensureSupportThread(),
    enabled: Boolean(session) && enabled,
    staleTime: 60_000,
  });
  const threadId = thread.data?.id;

  const messages = useQuery({
    queryKey: queryKeys.chatMessages(threadId ?? ""),
    queryFn: () => chatService.messages(threadId!, myUserId),
    enabled: Boolean(threadId) && enabled,
    refetchInterval: MESSAGE_POLL_MS,
  });

  const send = useMutation({
    mutationFn: (text: string) => chatService.send(threadId!, text, myUserId),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessage[]>(queryKeys.chatMessages(threadId ?? ""), (prev = []) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
      // A new message reopens a resolved thread on the server; pick up the new status.
      queryClient.invalidateQueries({ queryKey: SUPPORT_THREAD_KEY });
    },
  });

  const setStatus = useMutation({
    mutationFn: (status: string) => chatService.setSupportStatus(threadId!, status),
    onSuccess: (updated) => queryClient.setQueryData(SUPPORT_THREAD_KEY, updated),
  });

  return { thread, messages, send, setStatus };
}

/** Deletes one of your own messages and drops it from the open conversation. */
export function useDeleteChatMessage(threadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => chatService.deleteMessage(messageId),
    onSuccess: (_res, messageId) => {
      queryClient.setQueryData<ChatMessage[]>(queryKeys.chatMessages(threadId ?? ""), (prev = []) => prev.filter((m) => m.id !== messageId));
      queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads });
    },
  });
}
