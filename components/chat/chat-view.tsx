"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, useRef } from "react";
import { toast } from "sonner";
import { ChevronLeft, Mic, Paperclip, Send, X } from "lucide-react";
import type { Store } from "@/types/catalog";
import type { ChatMessage } from "@/types/chat";
import { RequireLogin } from "@/components/auth/require-login";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { useChatMessages, useSendMessage, useStoreThread } from "@/hooks/use-chats";
import { cn } from "@/libs/cn";
import { formatChatDayDivider, formatChatTime } from "@/libs/format";

/** Flattens messages into render items, inserting a "Today" / "Yesterday" / date pill before each new day. */
function withDayDividers(messages: ChatMessage[]) {
  const items: ({ kind: "divider"; label: string; key: string } | { kind: "message"; message: ChatMessage })[] = [];
  let lastDay: string | null = null;
  for (const message of messages) {
    const day = formatChatDayDivider(message.createdAt);
    if (day !== lastDay) {
      items.push({ kind: "divider", label: day, key: `divider-${message.id}` });
      lastDay = day;
    }
    items.push({ kind: "message", message });
  }
  return items;
}

/** Whoever is on the other end of the conversation, as little of them as the header needs. */
export type ChatPeer = {
  name: string;
  logoUrl: string | null;
  /** Present for a vendor store, so the header can link back to it. */
  slug?: string | null;
};

function formatPeerName(name: string) {
  return name.includes("_")
    ? name
        .replace(/_+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
        .trim()
    : name;
}

/**
 * One conversation, for a thread that is already known. `ChatThread` wraps this for the store page
 * (where only the store is known); the account "Chats" tab renders it directly from its thread list.
 */
export function ChatConversation({
  peer,
  threadId,
  isOpening = false,
  onBack,
  className,
}: {
  peer: ChatPeer;
  threadId: string | undefined;
  /** True while the thread id is still being resolved. */
  isOpening?: boolean;
  onBack?: () => void;
  className?: string;
}) {
  const messages = useChatMessages(threadId);
  const send = useSendMessage(threadId);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const items = useMemo(() => withDayDividers(messages.data ?? []), [messages.data]);
  const peerName = formatPeerName(peer.name);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    // A photo on its own is a valid message, so only an empty box *and* no file is a no-op.
    if ((!text && !attachment) || send.isPending) return;

    const sent = attachment;
    // Cleared up front so the box feels instant, and put back if the send fails.
    setDraft("");
    setAttachment(null);
    send.mutate(
      { text, attachment: sent },
      {
        onError: (error) => {
          setDraft(text);
          setAttachment(sent);
          toast.error(error instanceof Error ? error.message : "Your message didn’t send");
        },
      },
    );
  };

  const loading = isOpening || messages.isPending;

  return (
    <div className={cn("flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-3xl border border-line bg-surface", className)}>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        {onBack ? (
          <button type="button" onClick={onBack} className="press grid size-9 shrink-0 place-items-center rounded-full hover:bg-surface-muted" aria-label="Back to conversations">
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        ) : (
          peer.slug && (
            <Link href={`/stores/${peer.slug}`} className="press grid size-9 shrink-0 place-items-center rounded-full hover:bg-surface-muted" aria-label="Back to store">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
          )
        )}
        <Media src={peer.logoUrl} name={peerName} sizes="40px" className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{peerName}</p>
          <p className="text-xs text-muted">Usually replies within a few hours</p>
        </div>
      </div>

      <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-6">
        {loading ? (
          <li className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("h-12 animate-pulse rounded-2xl bg-surface-muted", i % 2 ? "ml-auto w-1/2" : "w-2/3")} />
            ))}
          </li>
        ) : messages.isError ? (
          <li className="py-10 text-center text-sm text-muted">
            We couldn’t load this conversation.{" "}
            <button type="button" onClick={() => messages.refetch()} className="press font-medium text-accent underline">
              Try again
            </button>
          </li>
        ) : items.length === 0 ? (
          <li className="py-10 text-center text-sm text-muted">No messages yet. Say hello to {peerName}.</li>
        ) : null}

        {items.map((item) => {
          if (item.kind === "divider") {
            return (
              <li key={item.key} className="flex justify-center py-1">
                <span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-medium text-muted">{item.label}</span>
              </li>
            );
          }
          const { message } = item;
          const mine = message.from === "me";
          return (
            <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6", mine ? "rounded-br-sm bg-accent text-accent-foreground" : "rounded-bl-sm bg-surface-muted")}>
                <p>{message.text}</p>
                <p className={cn("mt-1 text-[11px]", mine ? "text-accent-foreground/70" : "text-muted")}>{formatChatTime(message.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {attachment && (
        <div className="flex items-center gap-2 border-t border-line px-4 pt-3">
          <span className="flex min-w-0 items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-xs">
            <Paperclip className="size-3.5 shrink-0 text-muted" aria-hidden />
            <span className="truncate">{attachment.name}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              aria-label={`Remove ${attachment.name}`}
              className="press shrink-0 text-muted hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        </div>
      )}

      <form onSubmit={onSubmit} className={cn("flex min-w-0 items-center gap-2 p-4", !attachment && "border-t border-line")}>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setAttachment(file);
            // Reset so picking the same file twice in a row still fires onChange.
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label="Attach a file"
          className={cn(
            "press grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-muted",
            attachment ? "text-accent" : "text-muted",
          )}
        >
          <Paperclip className="size-4.5" aria-hidden />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${peerName}…`}
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm outline-none focus-visible:outline-none focus:border-foreground"
        />
        {draft.trim() || attachment ? (
          <button
            type="submit"
            aria-label="Send message"
            disabled={send.isPending || !threadId}
            className="press grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground disabled:opacity-60"
          >
            <Send className="size-4.5" aria-hidden />
          </button>
        ) : (
          <span
            aria-disabled="true"
            aria-label="Record a voice message"
            title="Voice messages are only in the ODOS app for now"
            className="grid size-11 shrink-0 cursor-not-allowed place-items-center rounded-full bg-accent text-accent-foreground opacity-50"
          >
            <Mic className="size-4.5" aria-hidden />
          </span>
        )}
      </form>
    </div>
  );
}

/** The conversation with a vendor, opening (or reusing) the thread for that store first. */
export function ChatThread({ store, onBack, className }: { store: Store; onBack?: () => void; className?: string }) {
  const thread = useStoreThread(store.id);

  return (
    <ChatConversation
      peer={{ name: store.name, logoUrl: store.logoUrl, slug: store.slug }}
      threadId={thread.data?.id}
      isOpening={thread.isPending}
      onBack={onBack}
      className={className}
    />
  );
}

export function ChatView({ store }: { store: Store }) {
  return (
    <Container className="py-8 sm:py-12">
      <RequireLogin next={`/stores/${store.slug}/chat`} message={`Log in to chat with ${store.name}.`}>
        <ChatThread store={store} />
      </RequireLogin>
    </Container>
  );
}
