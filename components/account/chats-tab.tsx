"use client";

import { useState } from "react";
import { ChevronRight, MessageCircle, Search } from "lucide-react";
import { ChatConversation } from "@/components/chat/chat-view";
import { Media } from "@/components/ui/media";
import { useChatThreads } from "@/hooks/use-chats";
import { useQueryParam } from "@/hooks/use-query-param";
import { cn } from "@/libs/cn";
import { formatChatListTime } from "@/libs/format";
import type { ChatThread } from "@/types/chat";

function ThreadRow({ thread, onOpen }: { thread: ChatThread; onOpen: () => void }) {
  const unread = thread.unreadCount > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="press flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left hover:border-foreground"
    >
      <Media src={thread.counterpartAvatarUrl} name={thread.counterpartName} sizes="48px" className="size-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{thread.counterpartName}</p>
          {unread && <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden />}
        </div>
        <p className={cn("mt-0.5 truncate text-xs", unread ? "font-medium text-foreground" : "text-muted")}>
          {thread.lastMessage ?? "No messages yet"}
        </p>
      </div>
      <div className={cn("flex shrink-0 items-center gap-1", unread ? "text-accent" : "text-muted")}>
        <span className="text-xs font-medium">{formatChatListTime(thread.lastMessageAt ?? thread.updatedAt)}</span>
        <ChevronRight className="size-4" aria-hidden />
      </div>
    </button>
  );
}

function SidebarRow({ thread, active, onOpen }: { thread: ChatThread; active: boolean; onOpen: () => void }) {
  const unread = thread.unreadCount > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={active}
      className={cn(
        "press flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-b-0",
        active ? "bg-accent-soft" : "hover:bg-surface-muted",
      )}
    >
      <Media src={thread.counterpartAvatarUrl} name={thread.counterpartName} sizes="40px" className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{thread.counterpartName}</p>
          <span className="shrink-0 text-[11px] text-muted">{formatChatListTime(thread.lastMessageAt ?? thread.updatedAt)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {unread && <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />}
          <p className={cn("truncate text-xs", unread ? "font-medium text-foreground" : "text-muted")}>
            {thread.lastMessage ?? "No messages yet"}
          </p>
        </div>
      </div>
    </button>
  );
}

export function ChatsTab() {
  const { threads, isPending } = useChatThreads();
  // Kept in the URL (like the other account tabs) so refreshing an open thread doesn't drop back to the list.
  const [activeId, setActiveId] = useQueryParam("thread");
  const [search, setSearch] = useState("");
  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  const filtered = search.trim()
    ? threads.filter((t) => t.counterpartName.toLowerCase().includes(search.trim().toLowerCase()))
    : threads;

  const peerOf = (thread: ChatThread) => ({
    name: thread.counterpartName,
    logoUrl: thread.counterpartAvatarUrl,
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">Vendor conversations</h2>
        <p className="mt-1 text-sm text-muted">Keep every store chat in one place. Unread messages stay highlighted until you open the thread.</p>
      </div>

      {/* Narrow screens: the list, or the open thread full-width with a back button. */}
      <div className="lg:hidden">
        {activeThread ? (
          <ChatConversation peer={peerOf(activeThread)} threadId={activeThread.id} onBack={() => setActiveId(null)} />
        ) : isPending ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-muted" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
            No conversations yet. Message a store from its page and it will show up here.
          </p>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <ThreadRow key={thread.id} thread={thread} onOpen={() => setActiveId(thread.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Wide screens: list and open thread side by side, like a desktop inbox — no navigating away. */}
      <div className="hidden overflow-hidden rounded-3xl border border-line lg:flex lg:h-[75vh] lg:min-h-136">
        <div className="flex w-72 shrink-0 flex-col border-r border-line bg-surface">
          <div className="border-b border-line p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="h-10 w-full rounded-full border border-line bg-surface-muted py-2 pr-3 pl-9 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted">No conversations found</p>
            ) : (
              filtered.map((thread) => (
                <SidebarRow
                  key={thread.id}
                  thread={thread}
                  active={thread.id === activeId}
                  onOpen={() => setActiveId(thread.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex-1">
          {activeThread ? (
            <ChatConversation peer={peerOf(activeThread)} threadId={activeThread.id} className="h-full rounded-none border-0" />
          ) : (
            <div className="grid h-full place-items-center p-6 text-center">
              <div>
                <MessageCircle className="mx-auto size-8 text-muted" aria-hidden />
                <p className="mt-3 text-sm font-medium">Select a conversation</p>
                <p className="mt-1 text-xs text-muted">Pick a thread from the list to see the full conversation here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
