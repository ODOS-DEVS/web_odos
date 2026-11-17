/** Where the shopper is when they open the assistant, so answers can be about what they're looking at. */
export type AssistantContext = {
  type: "store" | "product" | "checkout";
  storeId?: string | null;
  storeName?: string | null;
  marketTitle?: string | null;
  category?: string | null;
  productId?: string | null;
  productTitle?: string | null;
};

/** A thing the assistant suggests doing next. `route` arrives as a *mobile* path and is remapped. */
export type AssistantAction = {
  label: string;
  /** Already translated to a web path, or null when the mobile route has no web equivalent. */
  href: string | null;
  rawRoute: string;
};

export type AssistantProduct = {
  id: string;
  title: string;
  price: number;
  oldPrice: number | null;
  discount: string | null;
  imageUrl: string | null;
  storeId: string | null;
  rating: number | null;
  category: string | null;
};

export type AssistantStore = {
  id: string;
  title: string;
  category: string | null;
  imageUrl: string | null;
  marketSlug: string | null;
  rating: number | null;
};

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions: AssistantAction[];
  products: AssistantProduct[];
  stores: AssistantStore[];
  escalatedToSupport: boolean;
  createdAt: string | null;
  /** Set while a send is in flight or has failed, so the bubble can show its own state. */
  pending?: boolean;
  failed?: boolean;
};

export type AssistantNudge = { message: string; prompt: string; kind: string };

/**
 * Whether a real model is answering. `enabled: false` with `provider: "fallback"` means the
 * backend is doing keyword product search rather than talking to an LLM — still useful, but the
 * UI must not imply more than that.
 */
export type AssistantStatus = {
  enabled: boolean;
  provider: string;
  model: string | null;
  llmReachable: boolean | null;
  llmError: string | null;
};

export type AssistantSession = {
  conversationId: string | null;
  messages: AssistantMessage[];
  nudge: AssistantNudge | null;
  context: AssistantContext | null;
};

export type AssistantReply = {
  reply: string;
  conversationId: string | null;
  messageId: string | null;
  actions: AssistantAction[];
  products: AssistantProduct[];
  stores: AssistantStore[];
  escalatedToSupport: boolean;
};
