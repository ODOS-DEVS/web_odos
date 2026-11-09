"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ChevronLeft, Mic, Paperclip, Send, Trash2 } from "lucide-react";
import type { Store } from "@/types/catalog";
import { RequireLogin } from "@/components/auth/require-login";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";
import { formatChatDayDivider, formatChatTime } from "@/libs/format";
import { useDeleteChatMessage, useStoreChat } from "@/hooks/use-chats";
import type { ChatMessage } from "@/services/chat.service";

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

/**
 * Also reused standalone (no `onBack`) by the account "Chats" tab, which swaps the store-page link for a
 * list-view back button on narrow screens, or embeds this directly beside the thread list (`className`
 * override) as the right-hand pane of its desktop sidebar layout.
 */
export function ChatThread({
  store,
  productId,
  onBack,
  className,
}: {
  store: Store;
  /** The product the shopper came from; attached when the thread is first created. */
  productId?: string;
  onBack?: () => void;
  className?: string;
}) {
  const { thread, messages, send } = useStoreChat(store.id, productId);
  const remove = useDeleteChatMessage(thread.data?.id);
  const [draft, setDraft] = useState("");
  const items = useMemo(() => withDayDividers(messages.data ?? []), [messages.data]);
  const loading = thread.isPending || (Boolean(thread.data) && messages.isPending);
  const failed = thread.isError || messages.isError;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !thread.data || send.isPending) return;
    send.mutate(text, {
      onSuccess: () => setDraft(""),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className={cn("flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-3xl border border-line bg-surface", className)}>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        {onBack ? (
          <button type="button" onClick={onBack} className="press grid size-9 shrink-0 place-items-center rounded-full hover:bg-surface-muted" aria-label="Back to conversations">
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        ) : (
          <Link href={`/stores/${store.slug}`} className="press grid size-9 shrink-0 place-items-center rounded-full hover:bg-surface-muted" aria-label="Back to store">
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
        )}
        <Media src={store.logoUrl} name={store.name} sizes="40px" className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{store.name}</p>
          <p className="text-xs text-muted">Usually replies within a few hours</p>
        </div>
      </div>

      <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-6" aria-busy={loading}>
        {loading && <li className="h-24 animate-pulse rounded-2xl bg-surface-muted" />}
        {failed && (
          <li className="py-10 text-center text-sm text-muted">
            We couldn’t load this conversation.{" "}
            <button type="button" className="font-medium text-foreground underline" onClick={() => (thread.isError ? thread.refetch() : messages.refetch())}>
              Try again
            </button>
          </li>
        )}
        {!loading && !failed && items.length === 0 && (
          <li className="py-10 text-center text-sm text-muted">Say hello to {store.name} — they’ll reply here.</li>
        )}
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
            <li key={message.id} className={cn("group flex items-center gap-1.5", mine ? "justify-end" : "justify-start")}>
              {mine && (
                <button
                  type="button"
                  onClick={() => remove.mutate(message.id, { onError: (error) => toast.error(error.message) })}
                  disabled={remove.isPending}
                  aria-label="Delete message"
                  className="grid size-7 shrink-0 place-items-center rounded-full text-muted opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              )}
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6", mine ? "rounded-br-sm bg-accent text-accent-foreground" : "rounded-bl-sm bg-surface-muted")}>
                {message.text && <p className="whitespace-pre-line">{message.text}</p>}
                {message.attachmentUrl && (
                  <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="underline">
                    View attachment
                  </a>
                )}
                <p className={cn("mt-1 text-[11px]", mine ? "text-accent-foreground/70" : "text-muted")}>{formatChatTime(message.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-4">
        <button
          type="button"
          onClick={() => toast("Attachments aren't available yet")}
          aria-label="Attach a file"
          className="press grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted"
        >
          <Paperclip className="size-4.5" aria-hidden />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${store.name}…`}
          className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-sm outline-none focus-visible:outline-none focus:border-foreground"
        />
        {draft.trim() ? (
          <button
            type="submit"
            aria-label="Send message"
            disabled={send.isPending || !thread.data}
            className="press grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"
          >
            <Send className="size-4.5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => toast("Voice messages aren't available yet")}
            aria-label="Record a voice message"
            className="press grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"
          >
            <Mic className="size-4.5" aria-hidden />
          </button>
        )}
      </form>
    </div>
  );
}

export function ChatView({ store, productId }: { store: Store; productId?: string }) {
  return (
    <Container className="py-8 sm:py-12">
      <RequireLogin next={`/stores/${store.slug}/chat`} message={`Log in to chat with ${store.name}.`}>
        <ChatThread store={store} productId={productId} />
      </RequireLogin>
    </Container>
  );
}
