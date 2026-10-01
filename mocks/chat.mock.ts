/** Temporary dummy vendor chat standing in for the real `/chat` endpoints. Delete along with `mocks/`. */

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
