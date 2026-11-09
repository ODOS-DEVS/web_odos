/** The vendor's store as chat returns it — a summary, not the full `catalog.Store`. */
export type ChatStoreSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type ChatThread = {
  id: string;
  store: ChatStoreSummary | null;
  /** The person on the other end (vendor, or an admin on a support thread). */
  counterpartName: string;
  counterpartAvatarUrl: string | null;
  subject: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  /** Resolved from the sender's role, so the bubble knows which side to sit on. */
  from: "me" | "store";
  text: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  createdAt: string;
};
