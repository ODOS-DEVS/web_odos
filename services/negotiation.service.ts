import { NEGOTIATION_ENDPOINTS } from "@/libs/api-endpoint";
import { apiFetch } from "./http";
import type {
  Negotiation,
  NegotiationAgreement,
  NegotiationCounts,
  NegotiationOffer,
} from "@/types/negotiation";

type OfferRead = {
  id: string;
  actor_role: "customer" | "vendor";
  created_by_user_id: string;
  unit_price: number;
  quantity: number;
  message?: string | null;
  status: NegotiationOffer["status"];
  created_at: string;
  responded_at?: string | null;
};

type AgreementRead = {
  id: string;
  reference: string;
  negotiation_id: string;
  product_id: string;
  listed_unit_price: number;
  agreed_unit_price: number;
  quantity: number;
  currency: string;
  status: NegotiationAgreement["status"];
  accepted_at: string;
  expires_at: string;
  seconds_remaining?: number;
  order_id?: string | null;
  order_number?: string | null;
  used_at?: string | null;
};

type NegotiationRead = {
  id: string;
  reference: string;
  product_id: string;
  product_title: string;
  product_image_url?: string | null;
  store_id: string;
  store_name?: string | null;
  vendor_user_id: string;
  customer_user_id: string;
  customer_name?: string | null;
  thread_id?: string | null;
  selected_color?: string | null;
  selected_size?: string | null;
  listed_unit_price: number;
  current_listed_price?: number | null;
  status: Negotiation["status"];
  awaiting?: "customer" | "vendor" | null;
  latest_offer?: OfferRead | null;
  agreement?: AgreementRead | null;
  offers?: OfferRead[];
  created_at: string;
  updated_at: string;
};

type CountsRead = {
  total: number;
  awaiting_me: number;
  awaiting_them: number;
  agreed: number;
  completed: number;
  rejected: number;
  expired: number;
};

const toOffer = (o: OfferRead): NegotiationOffer => ({
  id: o.id,
  actorRole: o.actor_role,
  createdByUserId: o.created_by_user_id,
  unitPrice: o.unit_price,
  quantity: o.quantity,
  message: o.message ?? null,
  status: o.status,
  createdAt: o.created_at,
  respondedAt: o.responded_at ?? null,
});

const toAgreement = (a: AgreementRead): NegotiationAgreement => ({
  id: a.id,
  reference: a.reference,
  negotiationId: a.negotiation_id,
  productId: a.product_id,
  listedUnitPrice: a.listed_unit_price,
  agreedUnitPrice: a.agreed_unit_price,
  quantity: a.quantity,
  currency: a.currency,
  status: a.status,
  acceptedAt: a.accepted_at,
  expiresAt: a.expires_at,
  secondsRemaining: a.seconds_remaining ?? 0,
  orderId: a.order_id ?? null,
  orderNumber: a.order_number ?? null,
  usedAt: a.used_at ?? null,
});

const toNegotiation = (n: NegotiationRead): Negotiation => ({
  id: n.id,
  reference: n.reference,
  productId: n.product_id,
  productTitle: n.product_title,
  productImageUrl: n.product_image_url ?? null,
  storeId: n.store_id,
  storeName: n.store_name ?? null,
  vendorUserId: n.vendor_user_id,
  customerUserId: n.customer_user_id,
  customerName: n.customer_name ?? null,
  threadId: n.thread_id ?? null,
  selectedColor: n.selected_color ?? null,
  selectedSize: n.selected_size ?? null,
  listedUnitPrice: n.listed_unit_price,
  currentListedPrice: n.current_listed_price ?? null,
  status: n.status,
  awaiting: n.awaiting ?? null,
  latestOffer: n.latest_offer ? toOffer(n.latest_offer) : null,
  agreement: n.agreement ? toAgreement(n.agreement) : null,
  offers: (n.offers ?? []).map(toOffer),
  createdAt: n.created_at,
  updatedAt: n.updated_at,
});

/**
 * Price negotiation.
 *
 * No endpoint here takes a user or vendor id: the API resolves the caller's side from the
 * negotiation itself, so there is nothing in a request that could point an action at someone
 * else's haggle. Prices are likewise never sent at checkout — the agreed figure is found
 * server-side from the signed-in shopper and the product.
 */
export const negotiationService = {
  async list(role: "customer" | "vendor", status?: string): Promise<Negotiation[]> {
    const rows = await apiFetch<NegotiationRead[]>(NEGOTIATION_ENDPOINTS.list, {
      query: { role, ...(status && status !== "all" ? { status } : {}) },
      revalidate: false,
    });
    return rows.map(toNegotiation);
  },

  async counts(role: "customer" | "vendor"): Promise<NegotiationCounts> {
    const c = await apiFetch<CountsRead>(NEGOTIATION_ENDPOINTS.counts, {
      query: { role },
      revalidate: false,
    });
    return {
      total: c.total,
      awaitingMe: c.awaiting_me,
      awaitingThem: c.awaiting_them,
      agreed: c.agreed,
      completed: c.completed,
      rejected: c.rejected,
      expired: c.expired,
    };
  },

  async one(id: string): Promise<Negotiation> {
    return toNegotiation(await apiFetch<NegotiationRead>(NEGOTIATION_ENDPOINTS.one(id), { revalidate: false }));
  },

  async start(input: {
    productId: string;
    unitPrice: number;
    quantity: number;
    message?: string | null;
    selectedColor?: string | null;
    selectedSize?: string | null;
  }): Promise<Negotiation> {
    return toNegotiation(
      await apiFetch<NegotiationRead>(NEGOTIATION_ENDPOINTS.list, {
        method: "POST",
        body: {
          product_id: input.productId,
          unit_price: input.unitPrice,
          quantity: input.quantity,
          message: input.message ?? null,
          selected_color: input.selectedColor ?? null,
          selected_size: input.selectedSize ?? null,
        },
      }),
    );
  },

  async counter(id: string, input: { unitPrice: number; quantity?: number; message?: string | null }) {
    return toNegotiation(
      await apiFetch<NegotiationRead>(NEGOTIATION_ENDPOINTS.counter(id), {
        method: "POST",
        body: {
          unit_price: input.unitPrice,
          quantity: input.quantity ?? null,
          message: input.message ?? null,
        },
      }),
    );
  },

  async accept(id: string) {
    return toNegotiation(await apiFetch<NegotiationRead>(NEGOTIATION_ENDPOINTS.accept(id), { method: "POST" }));
  },

  async reject(id: string, message?: string | null) {
    return toNegotiation(
      await apiFetch<NegotiationRead>(NEGOTIATION_ENDPOINTS.reject(id), {
        method: "POST",
        body: { message: message ?? null },
      }),
    );
  },

  async withdraw(id: string) {
    return toNegotiation(await apiFetch<NegotiationRead>(NEGOTIATION_ENDPOINTS.withdraw(id), { method: "POST" }));
  },
};
