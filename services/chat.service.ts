import { CHAT_ENDPOINTS } from "@/libs/api-endpoint";
import type { ChatMessage, ChatThread } from "@/types/chat";
import { apiFetch } from "./http";

type ChatStoreSummaryRead = { id: string; title: string; image_url?: string | null };
type ChatCounterpartRead = { user_id: string; name: string; avatar_url?: string | null; role: string };

type ChatThreadRead = {
  id: string;
  store?: ChatStoreSummaryRead | null;
  counterpart?: ChatCounterpartRead | null;
  subject?: string | null;
  last_message_text?: string | null;
  last_message_at?: string | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
};

type ChatMessageRead = {
  id: string;
  thread_id: string;
  sender_role: string;
  body: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  created_at: string;
};

function toThread(t: ChatThreadRead): ChatThread {
  return {
    id: t.id,
    store: t.store ? { id: t.store.id, name: t.store.title, imageUrl: t.store.image_url ?? null } : null,
    counterpartName: t.counterpart?.name ?? t.store?.title ?? "ODOS",
    counterpartAvatarUrl: t.counterpart?.avatar_url ?? t.store?.image_url ?? null,
    subject: t.subject ?? null,
    lastMessage: t.last_message_text ?? null,
    lastMessageAt: t.last_message_at ?? null,
    unreadCount: t.unread_count ?? 0,
    updatedAt: t.updated_at,
  };
}

/** This app is always the customer side, so anything the customer sent is "mine". */
function toMessage(m: ChatMessageRead): ChatMessage {
  return {
    id: m.id,
    from: m.sender_role === "customer" ? "me" : "store",
    text: m.body,
    attachmentUrl: m.attachment_url ?? null,
    attachmentType: m.attachment_type ?? null,
    createdAt: m.created_at,
  };
}

export const chatService = {
  async threads(): Promise<ChatThread[]> {
    const rows = await apiFetch<ChatThreadRead[]>(CHAT_ENDPOINTS.threads, { revalidate: false });
    // Most recently active first — the API does not guarantee an order.
    return rows
      .map(toThread)
      .sort((a, b) => Date.parse(b.lastMessageAt ?? b.updatedAt) - Date.parse(a.lastMessageAt ?? a.updatedAt));
  },

  /** Opens (or reuses) the thread with a vendor. Safe to call every time the chat page loads. */
  async ensureStoreThread(storeId: string, product?: { id: string; title: string; imageUrl: string | null }): Promise<ChatThread> {
    const body = product
      ? { product_id: product.id, product_title: product.title, product_image_url: product.imageUrl }
      : {};
    return toThread(await apiFetch<ChatThreadRead>(CHAT_ENDPOINTS.storeThread(storeId), { method: "POST", body }));
  },

  async messages(threadId: string): Promise<ChatMessage[]> {
    const rows = await apiFetch<ChatMessageRead[]>(CHAT_ENDPOINTS.messages(threadId), { revalidate: false });
    return rows.map(toMessage);
  },

  /** The endpoint takes multipart (it also accepts attachments), so the body goes as `FormData`. */
  async send(threadId: string, text: string): Promise<ChatMessage> {
    const form = new FormData();
    form.append("body", text);
    return toMessage(
      await apiFetch<ChatMessageRead>(CHAT_ENDPOINTS.messages(threadId), { method: "POST", body: form, revalidate: false }),
    );
  },
};
