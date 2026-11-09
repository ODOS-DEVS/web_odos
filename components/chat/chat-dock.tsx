"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, MessageCircle, X } from "lucide-react";
import { ChatConversation } from "@/components/chat/chat-view";
import { Media } from "@/components/ui/media";
import { useSession } from "@/hooks/use-auth";
import { useChatThreads } from "@/hooks/use-chats";
import { cn } from "@/libs/cn";
import { formatChatListTime } from "@/libs/format";
import type { ChatThread } from "@/types/chat";

/** Pages that are already a full-screen conversation — a floating copy there would be noise. */
const HIDDEN_ON = [/^\/stores\/[^/]+\/chat$/];

function DockThreadRow({ thread, onOpen }: { thread: ChatThread; onOpen: () => void }) {
  const unread = thread.unreadCount > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="press flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface-muted"
    >
      <Media
        src={thread.counterpartAvatarUrl}
        name={thread.counterpartName}
        sizes="36px"
        className="size-9 shrink-0 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{thread.counterpartName}</p>
          <span className="shrink-0 text-[11px] text-muted">
            {formatChatListTime(thread.lastMessageAt ?? thread.updatedAt)}
          </span>
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

/**
 * A messenger-style dock pinned bottom-right on every page: the conversation list collapsed into a
 * button, opening to the threads and then to one conversation, without leaving the page the shopper
 * is on. Signed-out visitors never see it, and it stays out of the way of the full chat pages.
 */
export function ChatDock() {
  const session = useSession();
  const pathname = usePathname();
  const { threads, unreadCount, isPending } = useChatThreads();
  const [open, setOpen] = useState(false);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event: PointerEvent) => {
      if (dockRef.current && event.target instanceof Node && !dockRef.current.contains(event.target)) {
        setOpen(false);
        setOpenThreadId(null);
      }
    };

    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  if (!session || HIDDEN_ON.some((pattern) => pattern.test(pathname))) return null;

  const activeThread = threads.find((t) => t.id === openThreadId) ?? null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unreadCount > 0 ? `Messages, ${unreadCount} unread` : "Messages"}
        className="press fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-foreground px-4 py-3 text-background shadow-lg sm:right-6 sm:bottom-6"
      >
        <MessageCircle className="size-5" aria-hidden />
        <span className="text-sm font-semibold">Messages</span>
        {unreadCount > 0 && (
          <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div ref={dockRef} className="fixed right-4 bottom-4 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:right-6 sm:bottom-6">
      {activeThread ? (
        <ChatConversation
          peer={{ name: activeThread.counterpartName, logoUrl: activeThread.counterpartAvatarUrl, slug: null }}
          threadId={activeThread.id}
          onBack={() => setOpenThreadId(null)}
          // Shorter than the full-page conversation so the dock stays a dock.
          className="h-[26rem] rounded-none border-0"
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
            <p className="text-sm font-semibold">Messages</p>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimise messages"
                className="press grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted"
              >
                <ChevronDown className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close messages"
                className="press grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="max-h-[10.5rem] divide-y divide-line overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            {isPending ? (
              <div className="space-y-2 p-3" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-muted" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted">
                No conversations yet. Message a store from its page to start one.
              </p>
            ) : (
              threads.map((thread) => (
                <DockThreadRow key={thread.id} thread={thread} onOpen={() => setOpenThreadId(thread.id)} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
