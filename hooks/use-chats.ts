"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_STORES } from "@/mocks/catalog.mock";
import { mockChatThreads, type ChatThreadSummary } from "@/mocks/chat.mock";
import { useMounted } from "./use-mounted";

const BASE_THREADS = mockChatThreads(MOCK_STORES);

type ChatsState = {
  readSlugs: string[];
  markRead: (slug: string) => void;
};

// There's no chat-read-state endpoint wired up yet, so it lives in the browser like wallet/favorites.
const useChatsStore = create<ChatsState>()(
  persist(
    (set, get) => ({
      readSlugs: [],
      markRead: (slug) => {
        if (get().readSlugs.includes(slug)) return;
        set({ readSlugs: [...get().readSlugs, slug] });
      },
    }),
    { name: "odos-chats-v1" },
  ),
);

/** The shopper's vendor chat threads, with unread state that clears once a thread's been opened. */
export function useChatThreads() {
  const ready = useMounted();
  const readSlugs = useChatsStore((s) => s.readSlugs);
  const markRead = useChatsStore((s) => s.markRead);

  const threads = useMemo<ChatThreadSummary[]>(
    () => BASE_THREADS.map((t) => ({ ...t, unread: t.unread && !readSlugs.includes(t.store.slug) })),
    [readSlugs],
  );

  const unreadCount = ready ? threads.filter((t) => t.unread).length : 0;

  return { ready, threads, unreadCount, markRead };
}
