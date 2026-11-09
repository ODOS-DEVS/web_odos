import { CHAT_ENDPOINTS } from "@/libs/api-endpoint";
import type { ChatMessageRead, ChatThreadEnsurePayload, ChatThreadRead } from "@/types/api";
import { apiFetch } from "./http";

export type ChatThreadInfo = {
  id: string;
  storeId: string;
  storeName: string;
  storeImageUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  updatedAt: string;
  /** "store" for shopper ↔ vendor threads, "support" for the ODOS support thread. */
  threadType: string;
  /** Support threads only: open, pending, resolved… (free text from the API). */
  supportStatus: string | null;
  supportAgent: string | null;
  subject: string | null;
};

export type ChatMessage = {
  id: string;
  /** "me" = the signed-in shopper. */
  from: "me" | "store";
  text: string;
  attachmentUrl: string | null;
  createdAt: string;
};

const toThread = (t: ChatThreadRead): ChatThreadInfo => ({
  id: t.id,
  storeId: t.store.id,
  storeName: t.store.title,
  storeImageUrl: t.store.image_url ?? null,
  lastMessage: t.last_message_text ?? null,
  lastMessageAt: t.last_message_at ?? null,
  unreadCount: t.unread_count ?? 0,
  updatedAt: t.last_message_at ?? t.updated_at,
  threadType: (t.thread_type ?? "store").toLowerCase(),
  supportStatus: t.support_status ?? null,
  supportAgent: (t as ChatThreadRead & { assigned_admin_name?: string | null }).assigned_admin_name ?? null,
  subject: t.subject ?? null,
});

export const isSupportThread = (t: Pick<ChatThreadInfo, "threadType">) => t.threadType.includes("support");

const toMessage = (m: ChatMessageRead, myUserId: string | null): ChatMessage => ({
  id: m.id,
  // Prefer the user id; fall back to the role when the session isn't known yet.
  from: (myUserId ? m.sender_user_id === myUserId : m.sender_role === "customer") ? "me" : "store",
  text: m.body,
  attachmentUrl: m.attachment_url ?? null,
  createdAt: m.created_at,
});

/** Shopper ↔ vendor chat (login required for every call). */
export const chatService = {
  async threads(): Promise<ChatThreadInfo[]> {
    const rows = await apiFetch<ChatThreadRead[]>(CHAT_ENDPOINTS.threads, { revalidate: false });
    return rows.map(toThread).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  },

  /** Opens the shopper's thread with a store, creating it the first time. Optionally about one product. */
  async ensureStoreThread(storeId: string, product?: ChatThreadEnsurePayload): Promise<ChatThreadInfo> {
    const row = await apiFetch<ChatThreadRead>(CHAT_ENDPOINTS.storeThread(storeId), { method: "POST", body: product ?? {} });
    return toThread(row);
  },

  async messages(threadId: string, myUserId: string | null): Promise<ChatMessage[]> {
    const rows = await apiFetch<ChatMessageRead[]>(CHAT_ENDPOINTS.messages(threadId), { revalidate: false });
    return rows.map((m) => toMessage(m, myUserId)).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  },

  /** Opens the shopper's ODOS support thread (POST /chat/threads/support), creating it the first time. */
  async ensureSupportThread(subject?: string | null): Promise<ChatThreadInfo> {
    const row = await apiFetch<ChatThreadRead>(CHAT_ENDPOINTS.supportThread, {
      method: "POST",
      body: { subject: subject?.trim() || null },
    });
    return toThread(row);
  },

  /** Marks a support thread resolved / reopens it (PATCH /chat/threads/{id}/support-status). */
  async setSupportStatus(threadId: string, status: string): Promise<ChatThreadInfo> {
    const row = await apiFetch<ChatThreadRead>(CHAT_ENDPOINTS.supportStatus(threadId), { method: "PATCH", body: { status } });
    return toThread(row);
  },

  /** Deletes one of your own messages (DELETE /chat/messages/{id}). */
  deleteMessage: (messageId: string) => apiFetch<unknown>(CHAT_ENDPOINTS.message(messageId), { method: "DELETE" }),

  /** The endpoint takes multipart form data (it also accepts attachments). */
  async send(threadId: string, text: string, myUserId: string | null): Promise<ChatMessage> {
    const form = new FormData();
    form.append("body", text);
    const row = await apiFetch<ChatMessageRead>(CHAT_ENDPOINTS.messages(threadId), { method: "POST", body: form });
    return toMessage(row, myUserId);
  },
};
