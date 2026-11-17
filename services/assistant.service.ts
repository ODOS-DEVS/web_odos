import { ASSISTANT_ENDPOINTS } from "@/libs/api-endpoint";
import { toWebRoute } from "@/libs/assistant-routes";
import type {
  AssistantAction,
  AssistantContext,
  AssistantMessage,
  AssistantProduct,
  AssistantReply,
  AssistantSession,
  AssistantStatus,
  AssistantStore,
} from "@/types/assistant";
import { apiFetch } from "./http";

/* ---------- Wire shapes ---------- */

type ActionRead = { label: string; route: string; params?: Record<string, string> | null };
type ProductRead = {
  id: string;
  title: string;
  price: number;
  old_price?: number | null;
  discount?: string | null;
  image_url?: string | null;
  image_key?: string | null;
  store_id?: string | null;
  rating?: number | null;
  category?: string | null;
};
type StoreRead = {
  id: string;
  title: string;
  category?: string | null;
  image_url?: string | null;
  image_key?: string | null;
  market_slug?: string | null;
  market_title?: string | null;
  rating?: number | null;
};
type MessageRead = {
  id: string;
  role: string;
  content: string;
  suggested_actions?: ActionRead[] | null;
  products?: ProductRead[] | null;
  stores?: StoreRead[] | null;
  escalated_to_support?: boolean;
  created_at?: string | null;
};
type SessionRead = {
  conversation_id?: string | null;
  messages?: MessageRead[];
  nudge?: { message: string; prompt: string; kind: string } | null;
  context?: ContextRead | null;
};
type ContextRead = {
  type?: "store" | "product" | "checkout";
  store_id?: string | null;
  store_name?: string | null;
  market_title?: string | null;
  category?: string | null;
  product_id?: string | null;
  product_title?: string | null;
};
type ChatRead = {
  reply: string;
  suggested_actions?: ActionRead[];
  escalated_to_support?: boolean;
  conversation_id?: string | null;
  message_id?: string | null;
  products?: ProductRead[];
  stores?: StoreRead[];
};
type StatusRead = {
  enabled: boolean;
  provider: string;
  model?: string | null;
  llm_reachable?: boolean | null;
  llm_error?: string | null;
};

/* ---------- Mappers ---------- */

/** Actions whose mobile route has no web equivalent are dropped, never rendered as dead links. */
const toActions = (rows: ActionRead[] | null | undefined): AssistantAction[] =>
  (rows ?? [])
    .map((a) => ({ label: a.label, href: toWebRoute(a.route, a.params), rawRoute: a.route }))
    .filter((a) => a.href !== null);

const toProduct = (p: ProductRead): AssistantProduct => ({
  id: p.id,
  title: p.title,
  price: p.price,
  oldPrice: p.old_price ?? null,
  discount: p.discount ?? null,
  imageUrl: p.image_url ?? null,
  storeId: p.store_id ?? null,
  rating: p.rating ?? null,
  category: p.category ?? null,
});

const toStore = (s: StoreRead): AssistantStore => ({
  id: s.id,
  title: s.title,
  category: s.category ?? null,
  imageUrl: s.image_url ?? null,
  marketSlug: s.market_slug ?? null,
  rating: s.rating ?? null,
});

function toMessage(m: MessageRead): AssistantMessage {
  return {
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
    actions: toActions(m.suggested_actions),
    products: (m.products ?? []).map(toProduct),
    stores: (m.stores ?? []).map(toStore),
    escalatedToSupport: Boolean(m.escalated_to_support),
    createdAt: m.created_at ?? null,
  };
}

const toContextWire = (context: AssistantContext | null | undefined) =>
  context
    ? {
        type: context.type,
        store_id: context.storeId ?? null,
        store_name: context.storeName ?? null,
        market_title: context.marketTitle ?? null,
        category: context.category ?? null,
        product_id: context.productId ?? null,
        product_title: context.productTitle ?? null,
      }
    : null;

export const assistantService = {
  /** Whether a real model is answering, or the keyword fallback is. */
  async status(): Promise<AssistantStatus> {
    const s = await apiFetch<StatusRead>(ASSISTANT_ENDPOINTS.status, { auth: false, revalidate: false });
    return {
      enabled: s.enabled,
      provider: s.provider,
      model: s.model ?? null,
      llmReachable: s.llm_reachable ?? null,
      llmError: s.llm_error ?? null,
    };
  },

  /** The signed-in shopper's existing conversation, so the thread survives a reload. */
  async session(): Promise<AssistantSession> {
    const s = await apiFetch<SessionRead>(ASSISTANT_ENDPOINTS.session, { revalidate: false });
    return {
      conversationId: s.conversation_id ?? null,
      messages: (s.messages ?? []).map(toMessage),
      nudge: s.nudge ? { message: s.nudge.message, prompt: s.nudge.prompt, kind: s.nudge.kind } : null,
      context: s.context
        ? {
            type: s.context.type ?? "store",
            storeId: s.context.store_id ?? null,
            storeName: s.context.store_name ?? null,
            marketTitle: s.context.market_title ?? null,
            category: s.context.category ?? null,
            productId: s.context.product_id ?? null,
            productTitle: s.context.product_title ?? null,
          }
        : null,
    };
  },

  /**
   * Sends a message. `history` is capped at 12 by the API, so only the most recent turns go up —
   * the server holds the authoritative thread for signed-in shoppers via `conversation_id`.
   */
  async chat(input: {
    message: string;
    history: AssistantMessage[];
    conversationId?: string | null;
    screen?: string | null;
    context?: AssistantContext | null;
  }): Promise<AssistantReply> {
    const r = await apiFetch<ChatRead>(ASSISTANT_ENDPOINTS.chat, {
      method: "POST",
      // Anonymous shoppers get answers too; only the stored thread needs a session.
      auth: false,
      revalidate: false,
      body: {
        message: input.message.trim(),
        history: input.history
          .filter((m) => !m.pending && !m.failed && m.content.trim())
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
        screen: input.screen ?? "web",
        conversation_id: input.conversationId ?? null,
        context: toContextWire(input.context),
      },
    });

    return {
      reply: r.reply,
      conversationId: r.conversation_id ?? null,
      messageId: r.message_id ?? null,
      actions: toActions(r.suggested_actions),
      products: (r.products ?? []).map(toProduct),
      stores: (r.stores ?? []).map(toStore),
      escalatedToSupport: Boolean(r.escalated_to_support),
    };
  },

  /** Thumbs up/down on one reply. Best-effort: never block the conversation on it. */
  async feedback(messageId: string, rating: 1 | -1): Promise<void> {
    try {
      await apiFetch<unknown>(ASSISTANT_ENDPOINTS.feedback, {
        method: "POST",
        body: { message_id: messageId, rating },
        revalidate: false,
      });
    } catch {
      // Rating the answer is not worth interrupting the chat.
    }
  },
};
