"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Headset, RotateCcw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteChatMessage, useSupportChat } from "@/hooks/use-chats";
import { cn } from "@/libs/cn";
import { formatChatDayDivider, formatChatTime } from "@/libs/format";
import type { ChatMessage } from "@/services/chat.service";

const STATUS_TONE: Record<string, BadgeTone> = { open: "accent", pending: "warning", in_progress: "warning", resolved: "success", closed: "neutral" };

function withDays(messages: ChatMessage[]) {
  const out: ({ kind: "day"; label: string; key: string } | { kind: "msg"; message: ChatMessage })[] = [];
  let last: string | null = null;
  for (const message of messages) {
    const day = formatChatDayDivider(message.createdAt);
    if (day !== last) out.push({ kind: "day", label: day, key: `d-${message.id}` });
    last = day;
    out.push({ kind: "msg", message });
  }
  return out;
}

/** Chat with ODOS support (POST /chat/threads/support), with resolve/reopen and deleting your own messages. */
export function SupportChat() {
  const [started, setStarted] = useState(false);
  const { thread, messages, send, setStatus } = useSupportChat(started);
  const remove = useDeleteChatMessage(thread.data?.id);
  const [draft, setDraft] = useState("");
  const items = useMemo(() => withDays(messages.data ?? []), [messages.data]);
  const status = (thread.data?.supportStatus ?? "open").toLowerCase();
  const resolved = /resolv|closed/.test(status);

  if (!started) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <Headset className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">Chat with ODOS support</p>
            <p className="text-sm text-muted">Questions about an order, payment or your account? We reply here.</p>
          </div>
        </div>
        <Button variant="accent" onClick={() => setStarted(true)}>
          Open support chat
        </Button>
      </div>
    );
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !thread.data || send.isPending) return;
    send.mutate(text, { onSuccess: () => setDraft(""), onError: (e) => toast.error(e.message) });
  };

  const toggleResolved = () =>
    setStatus.mutate(resolved ? "open" : "resolved", {
      onSuccess: () => toast.success(resolved ? "Conversation reopened" : "Marked as resolved"),
      onError: (e) => toast.error(e.message),
    });

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Headset className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">ODOS Support</p>
          <p className="truncate text-xs text-muted">{thread.data?.supportAgent ? `With ${thread.data.supportAgent}` : "We usually reply within a few hours"}</p>
        </div>
        {thread.data && <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status.replace(/_/g, " ")}</Badge>}
        {thread.data && (
          <Button size="sm" variant="ghost" onClick={toggleResolved} disabled={setStatus.isPending}>
            {resolved ? <RotateCcw className="mr-1 size-3.5" aria-hidden /> : <CheckCircle2 className="mr-1 size-3.5" aria-hidden />}
            {resolved ? "Reopen" : "Resolve"}
          </Button>
        )}
      </div>

      <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-5" aria-busy={thread.isPending || messages.isPending}>
        {(thread.isPending || (thread.data && messages.isPending)) && <li className="h-20 animate-pulse rounded-2xl bg-surface-muted" />}
        {(thread.isError || messages.isError) && (
          <li className="py-8 text-center text-sm text-muted">
            We couldn’t open support chat.{" "}
            <button type="button" className="font-medium text-foreground underline" onClick={() => (thread.isError ? thread.refetch() : messages.refetch())}>
              Try again
            </button>
          </li>
        )}
        {messages.isSuccess && items.length === 0 && <li className="py-8 text-center text-sm text-muted">Tell us what you need help with.</li>}
        {items.map((item) =>
          item.kind === "day" ? (
            <li key={item.key} className="flex justify-center">
              <span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-medium text-muted">{item.label}</span>
            </li>
          ) : (
            <li key={item.message.id} className={cn("group flex items-center gap-1.5", item.message.from === "me" ? "justify-end" : "justify-start")}>
              {item.message.from === "me" && (
                <button
                  type="button"
                  onClick={() => remove.mutate(item.message.id, { onError: (e) => toast.error(e.message) })}
                  aria-label="Delete message"
                  className="grid size-7 place-items-center rounded-full text-muted opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6",
                  item.message.from === "me" ? "rounded-br-sm bg-accent text-accent-foreground" : "rounded-bl-sm bg-surface-muted",
                )}
              >
                <p className="whitespace-pre-line">{item.message.text}</p>
                <p className={cn("mt-1 text-[11px]", item.message.from === "me" ? "text-accent-foreground/70" : "text-muted")}>
                  {formatChatTime(item.message.createdAt)}
                </p>
              </div>
            </li>
          ),
        )}
      </ul>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={resolved ? "Send a message to reopen…" : "Type your message…"}
          aria-label="Message support"
          className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-sm outline-none focus:border-foreground"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!draft.trim() || send.isPending || !thread.data}
          className="press grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground disabled:opacity-50"
        >
          <Send className="size-4.5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
