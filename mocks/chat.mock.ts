/** Temporary dummy vendor chat standing in for the real `/chat` endpoints. Delete along with `mocks/`. */

import type { Store } from "@/types/catalog";

export type ChatMessage = {
  id: string;
  from: "me" | "store";
  text: string;
  createdAt: string;
};

const now = Date.now();
const minutesAgo = (n: number) => new Date(now - n * 60_000).toISOString();

/** A short seeded conversation — stable per store so reloading the chat page doesn't reshuffle it. */
export function mockChatMessages(storeName: string): ChatMessage[] {
  return [
    { id: "m1", from: "store", text: `Hi! Thanks for reaching out to ${storeName}. How can we help?`, createdAt: minutesAgo(42) },
    { id: "m2", from: "me", text: "Hi, is this item still in stock?", createdAt: minutesAgo(38) },
    { id: "m3", from: "store", text: "Yes, we’ve got it in stock and can have it ready today.", createdAt: minutesAgo(35) },
  ];
}

export type ChatThreadSummary = { store: Store; lastMessage: string; updatedAt: string; unread: boolean };

/** One thread per store the shopper has messaged — backs the account "Chats" tab's list view. */
export function mockChatThreads(stores: Store[]): ChatThreadSummary[] {
  const [first, second, third] = stores;
  return [
    first && { store: first, lastMessage: "Yes, we’ve got it in stock and can have it ready today.", updatedAt: minutesAgo(35), unread: true },
    second && { store: second, lastMessage: "Thanks for your order — it ships out tomorrow morning.", updatedAt: minutesAgo(300), unread: false },
    third && { store: third, lastMessage: "We’ve restocked your size, grab it before it’s gone!", updatedAt: minutesAgo(2880), unread: false },
  ].filter((t): t is ChatThreadSummary => Boolean(t));
}
