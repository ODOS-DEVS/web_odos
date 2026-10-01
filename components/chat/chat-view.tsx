"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ChevronLeft, Send } from "lucide-react";
import type { Store } from "@/types/catalog";
import { RequireLogin } from "@/components/auth/require-login";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";
import { formatDateTime } from "@/libs/format";
import { type ChatMessage, mockChatMessages } from "@/mocks/chat.mock";

function ChatThread({ store }: { store: Store }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => mockChatMessages(store.name));
  const [draft, setDraft] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "me", text, createdAt: new Date().toISOString() }]);
    setDraft("");
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Link href={`/stores/${store.slug}`} className="press grid size-9 shrink-0 place-items-center rounded-full hover:bg-surface-muted" aria-label="Back to store">
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <Media src={store.logoUrl} name={store.name} sizes="40px" className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{store.name}</p>
          <p className="text-xs text-muted">Usually replies within a few hours</p>
        </div>
      </div>

      <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-6">
        {messages.map((message) => {
          const mine = message.from === "me";
          return (
            <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6", mine ? "rounded-br-sm bg-accent text-accent-foreground" : "rounded-bl-sm bg-surface-muted")}>
                <p>{message.text}</p>
                <p className={cn("mt-1 text-[11px]", mine ? "text-accent-foreground/70" : "text-muted")}>{formatDateTime(message.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-4">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${store.name}…`}
          className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-sm outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="press grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Send className="size-4.5" aria-hidden />
        </button>
      </form>
    </div>
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
