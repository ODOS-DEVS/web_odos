"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { assistantService } from "@/services/assistant.service";
import { useSession } from "./use-auth";
import type { AssistantContext, AssistantMessage, AssistantStatus } from "@/types/assistant";

/** Opening prompts, so a shopper is never staring at an empty box wondering what it can do. */
export const ASSISTANT_PROMPTS = [
  "What deals are on right now?",
  "Find me a gift under GH₵200",
  "Which stores deliver to Accra?",
  "Help me track my order",
];

const WELCOME: AssistantMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm the ODOS Assistant. Ask me to find products, compare prices, or point you to a store — I'll search the marketplace for you.",
  actions: [],
  products: [],
  stores: [],
  escalatedToSupport: false,
  createdAt: null,
};

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++idCounter}`;

/**
 * Drives one assistant conversation.
 *
 * Mirrors the mobile `useAssistant`: an optimistic user bubble, a pending assistant bubble that
 * is replaced by the real reply, a retry path for a failed send, and a reset. The thread is
 * restored from `/assistant/session` for signed-in shoppers so a reload does not lose it;
 * anonymous shoppers get a working-but-ephemeral conversation, which is what the API supports.
 */
export function useAssistant(context?: AssistantContext | null) {
  const session = useSession();
  // `null` means "nothing local yet, show whatever the server restored". Deriving the thread this
  // way rather than copying the session into state with an effect avoids a cascading render, and
  // means a reply that lands mid-restore can never be overwritten by the stored copy.
  const [localMessages, setLocalMessages] = useState<AssistantMessage[] | null>(null);
  const [localConversationId, setLocalConversationId] = useState<string | null>(null);
  const [isSending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["assistant", "status"] as const,
    queryFn: () => assistantService.status(),
    staleTime: 5 * 60_000,
  });

  const sessionQuery = useQuery({
    queryKey: ["assistant", "session"] as const,
    queryFn: () => assistantService.session(),
    enabled: Boolean(session),
    retry: false,
  });

  const stored = sessionQuery.data;
  const messages = useMemo(
    () => localMessages ?? (stored?.messages.length ? [WELCOME, ...stored.messages] : [WELCOME]),
    [localMessages, stored],
  );
  const conversationId = localConversationId ?? stored?.conversationId ?? null;

  /** Every mutation works from the thread currently on screen, restored or not. */
  const setMessages = useCallback(
    (update: (prev: AssistantMessage[]) => AssistantMessage[]) => setLocalMessages((prev) => update(prev ?? messages)),
    [messages],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isSending) return;

      setError(null);
      setSending(true);

      const userMessage: AssistantMessage = {
        id: nextId("user"),
        role: "user",
        content: text,
        actions: [],
        products: [],
        stores: [],
        escalatedToSupport: false,
        createdAt: new Date().toISOString(),
      };
      const placeholderId = nextId("pending");

      // History must be the thread *before* this turn, so it is captured here rather than read
      // back out of state (which would already include the optimistic bubbles).
      const history = messages;

      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: placeholderId,
          role: "assistant",
          content: "",
          actions: [],
          products: [],
          stores: [],
          escalatedToSupport: false,
          createdAt: null,
          pending: true,
        },
      ]);

      try {
        const reply = await assistantService.chat({ message: text, history, conversationId, context });
        if (reply.conversationId) setLocalConversationId(reply.conversationId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? {
                  id: reply.messageId ?? placeholderId,
                  role: "assistant",
                  content: reply.reply,
                  actions: reply.actions,
                  products: reply.products,
                  stores: reply.stores,
                  escalatedToSupport: reply.escalatedToSupport,
                  createdAt: new Date().toISOString(),
                }
              : m,
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "The assistant couldn't answer just then.");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? { ...m, pending: false, failed: true, content: "I couldn't answer that just then." }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [messages, conversationId, context, isSending, setMessages],
  );

  /** Re-sends the last thing the shopper asked, dropping the failed reply. */
  const retry = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === lastUser.id);
      return index === -1 ? prev : prev.slice(0, index);
    });
    void send(lastUser.content);
  }, [messages, send, setMessages]);

  const reset = useCallback(() => {
    // An explicit empty-but-local thread, so the restored session cannot refill what was cleared.
    setLocalMessages([WELCOME]);
    setLocalConversationId(null);
    setError(null);
  }, []);

  const status: AssistantStatus | undefined = statusQuery.data;
  const hasConversation = useMemo(() => messages.some((m) => m.role === "user"), [messages]);

  return {
    messages,
    status,
    isLoadingStatus: statusQuery.isPending,
    isSending,
    error,
    hasConversation,
    nudge: sessionQuery.data?.nudge ?? null,
    send,
    retry,
    reset,
    submitFeedback: assistantService.feedback,
  };
}
