/** Price negotiation: offers between one shopper and one vendor over one product. */

export type NegotiationActor = "customer" | "vendor";

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn" | "superseded";

export type NegotiationStatus =
  | "open"
  | "agreed"
  | "rejected"
  | "withdrawn"
  | "expired"
  | "completed";

export type NegotiationOffer = {
  id: string;
  actorRole: NegotiationActor;
  createdByUserId: string;
  unitPrice: number;
  quantity: number;
  message: string | null;
  status: OfferStatus;
  createdAt: string;
  respondedAt: string | null;
};

export type NegotiationAgreement = {
  id: string;
  reference: string;
  negotiationId: string;
  productId: string;
  listedUnitPrice: number;
  agreedUnitPrice: number;
  quantity: number;
  currency: string;
  status: "accepted" | "used" | "expired" | "cancelled";
  acceptedAt: string;
  expiresAt: string;
  /** Counted by the server. Preferred over the browser's clock on a deadline the shopper is racing. */
  secondsRemaining: number;
  orderId: string | null;
  orderNumber: string | null;
  usedAt: string | null;
};

export type Negotiation = {
  id: string;
  reference: string;
  productId: string;
  productTitle: string;
  productImageUrl: string | null;
  storeId: string;
  storeName: string | null;
  vendorUserId: string;
  customerUserId: string;
  customerName: string | null;
  threadId: string | null;
  selectedColor: string | null;
  selectedSize: string | null;
  /** Shelf price when haggling opened. May differ from the price today. */
  listedUnitPrice: number;
  currentListedPrice: number | null;
  status: NegotiationStatus;
  /** Whose move it is, or null when nothing is pending. */
  awaiting: NegotiationActor | null;
  latestOffer: NegotiationOffer | null;
  agreement: NegotiationAgreement | null;
  offers: NegotiationOffer[];
  createdAt: string;
  updatedAt: string;
};

export type NegotiationCounts = {
  total: number;
  awaitingMe: number;
  awaitingThem: number;
  agreed: number;
  completed: number;
  rejected: number;
  expired: number;
};
