import { SERVICE_ENDPOINTS } from "@/libs/api-endpoint";
import { toBookingStatus } from "@/libs/service-bookings";
import type {
  Booking,
  BookingDraft,
  BookingHold,
  BookingQuote,
  BookingSlot,
  Quotation,
  ServiceAddon,
  ServiceCategory,
  ServiceDetail,
  ServiceInput,
  ServicePackage,
  ServiceSummary,
} from "@/types/services";
import { apiFetch } from "./http";

/* ---------- Wire shapes ---------- */

type CategoryRead = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  icon?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  sort_order?: number;
};

type SummaryRead = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  store_id: string;
  category_id?: string | null;
  pricing_model: string;
  booking_type: string;
  base_price: number;
  currency: string;
  duration_minutes?: number | null;
  location_modes?: string[] | null;
  rating?: number | null;
  review_count?: number;
  image_url?: string | null;
};

type DetailRead = SummaryRead & {
  description?: string | null;
  payment_timing: string;
  service_areas?: string[] | null;
  lead_time_hours: number;
  max_advance_days: number;
  requirements_note?: string | null;
  cancellation_policy?: string | null;
  booking_count?: number;
  packages?: {
    id: string;
    title: string;
    description?: string | null;
    price: number;
    duration_minutes?: number | null;
    inclusions?: string[] | null;
  }[];
  addons?: { id: string; title: string; description?: string | null; price: number; max_quantity?: number }[];
  images?: { image_url?: string | null; caption?: string | null; is_portfolio?: boolean }[];
};

/* ---------- Mappers ---------- */

const toCategory = (c: CategoryRead): ServiceCategory => ({
  id: c.id,
  slug: c.slug,
  title: c.title,
  subtitle: c.subtitle ?? null,
  icon: c.icon ?? null,
  imageUrl: c.image_url ?? null,
  parentId: c.parent_id ?? null,
  sortOrder: c.sort_order ?? 0,
});

const toSummary = (s: SummaryRead): ServiceSummary => ({
  id: s.id,
  slug: s.slug,
  title: s.title,
  summary: s.summary ?? null,
  storeId: s.store_id,
  categoryId: s.category_id ?? null,
  pricingModel: s.pricing_model,
  bookingType: s.booking_type,
  basePrice: s.base_price,
  currency: s.currency,
  durationMinutes: s.duration_minutes ?? null,
  locationModes: s.location_modes ?? [],
  rating: s.rating ?? null,
  reviewCount: s.review_count ?? 0,
  imageUrl: s.image_url ?? null,
});

const toPackage = (p: NonNullable<DetailRead["packages"]>[number]): ServicePackage => ({
  id: p.id,
  name: p.title,
  description: p.description ?? null,
  price: p.price,
  durationMinutes: p.duration_minutes ?? null,
  inclusions: p.inclusions ?? [],
});

const toAddon = (a: NonNullable<DetailRead["addons"]>[number]): ServiceAddon => ({
  id: a.id,
  name: a.title,
  description: a.description ?? null,
  price: a.price,
  maxQuantity: a.max_quantity ?? 1,
});

const toDetail = (d: DetailRead): ServiceDetail => ({
  ...toSummary(d),
  description: d.description ?? null,
  paymentTiming: d.payment_timing,
  serviceAreas: d.service_areas ?? [],
  leadTimeHours: d.lead_time_hours,
  maxAdvanceDays: d.max_advance_days,
  requirementsNote: d.requirements_note ?? null,
  cancellationPolicy: d.cancellation_policy ?? null,
  bookingCount: d.booking_count ?? 0,
  packages: (d.packages ?? []).map(toPackage),
  addons: (d.addons ?? []).map(toAddon),
  images: (d.images ?? [])
    .map((i) => i.image_url)
    .filter((url): url is string => Boolean(url)),
  portfolio: (d.images ?? [])
    .filter((i) => i.is_portfolio && i.image_url)
    .map((i) => ({ url: i.image_url as string, caption: i.caption ?? null })),
});

export type ServiceListParams = {
  category?: string;
  q?: string;
  area?: string;
  limit?: number;
  offset?: number;
};

export const servicesService = {
  /** The admin-managed taxonomy. Public, so it can be prefetched for everyone. */
  async categories(): Promise<ServiceCategory[]> {
    const rows = await apiFetch<CategoryRead[]>(SERVICE_ENDPOINTS.categories, { auth: false });
    return rows.map(toCategory).sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  },

  async list(params: ServiceListParams = {}): Promise<ServiceSummary[]> {
    const rows = await apiFetch<SummaryRead[]>(SERVICE_ENDPOINTS.services, { auth: false, query: { limit: 60, ...params } });
    return rows.map(toSummary);
  },

  async detail(serviceId: string): Promise<ServiceDetail> {
    return toDetail(await apiFetch<DetailRead>(SERVICE_ENDPOINTS.service(serviceId), { auth: false }));
  },

  /* -- Provider side -- */

  async mine(): Promise<ServiceSummary[]> {
    const rows = await apiFetch<SummaryRead[]>(SERVICE_ENDPOINTS.vendorServices, { revalidate: false });
    return rows.map(toSummary);
  },

  create: (input: ServiceInput) =>
    apiFetch<unknown>(SERVICE_ENDPOINTS.vendorServices, { method: "POST", body: toWire(input), revalidate: false }),

  update: (serviceId: string, input: Partial<ServiceInput>) =>
    apiFetch<unknown>(SERVICE_ENDPOINTS.vendorService(serviceId), {
      method: "PATCH",
      body: toWire(input),
      revalidate: false,
    }),

  /** Publish / unpublish. The API owns which transitions are legal. */
  setStatus: (serviceId: string, status: string) =>
    apiFetch<unknown>(SERVICE_ENDPOINTS.vendorServiceStatus(serviceId), { method: "POST", body: { status } }),
};

function toWire(input: Partial<ServiceInput>) {
  return {
    title: input.title,
    summary: input.summary,
    description: input.description,
    category_id: input.categoryId,
    pricing_model: input.pricingModel,
    booking_type: input.bookingType,
    payment_timing: input.paymentTiming,
    base_price: input.basePrice,
    duration_minutes: input.durationMinutes,
    location_modes: input.locationModes,
    service_areas: input.serviceAreas,
    requirements_note: input.requirementsNote,
    cancellation_policy: input.cancellationPolicy,
  };
}

/* ---------- Bookings and quotations ---------- */

type BookingRead = {
  id: string;
  booking_number: string;
  service_id: string;
  store_id: string;
  status: string;
  booking_type: string;
  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;
  location_mode?: string | null;
  location_address?: string | null;
  location_city?: string | null;
  customer_note?: string | null;
  currency: string;
  base_amount: number;
  addons_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_status: string;
  payment_deadline_at?: string | null;
};

type QuotationRead = {
  id: string;
  reference: string;
  service_id: string;
  store_id: string;
  status: string;
  customer_brief: string;
  preferred_date?: string | null;
  location_mode?: string | null;
  location_city?: string | null;
  quoted_amount?: number | null;
  currency: string;
  provider_message?: string | null;
  estimated_duration_minutes?: number | null;
  expires_at?: string | null;
  booking_id?: string | null;
  created_at: string;
};

const toBooking = (b: BookingRead): Booking => ({
  id: b.id,
  bookingNumber: b.booking_number,
  serviceId: b.service_id,
  storeId: b.store_id,
  status: toBookingStatus(b.status),
  bookingType: b.booking_type,
  scheduledStartAt: b.scheduled_start_at ?? null,
  scheduledEndAt: b.scheduled_end_at ?? null,
  locationMode: b.location_mode ?? null,
  locationAddress: b.location_address ?? null,
  locationCity: b.location_city ?? null,
  customerNote: b.customer_note ?? null,
  currency: b.currency,
  baseAmount: b.base_amount,
  addonsAmount: b.addons_amount,
  totalAmount: b.total_amount,
  amountPaid: b.amount_paid,
  paymentStatus: b.payment_status,
  paymentDeadlineAt: b.payment_deadline_at ?? null,
});

const toQuotation = (q: QuotationRead): Quotation => ({
  id: q.id,
  reference: q.reference,
  serviceId: q.service_id,
  storeId: q.store_id,
  status: q.status,
  customerBrief: q.customer_brief,
  preferredDate: q.preferred_date ?? null,
  locationMode: q.location_mode ?? null,
  locationCity: q.location_city ?? null,
  quotedAmount: q.quoted_amount ?? null,
  currency: q.currency,
  providerMessage: q.provider_message ?? null,
  estimatedDurationMinutes: q.estimated_duration_minutes ?? null,
  expiresAt: q.expires_at ?? null,
  bookingId: q.booking_id ?? null,
  createdAt: q.created_at,
});

export const bookingsService = {
  /** Every booking against this provider's services. */
  async forProvider(): Promise<Booking[]> {
    const rows = await apiFetch<BookingRead[]>(SERVICE_ENDPOINTS.vendorServiceBookings, { revalidate: false });
    return rows.map(toBooking);
  },

  /** The shopper's own bookings. */
  async mine(): Promise<Booking[]> {
    const rows = await apiFetch<BookingRead[]>(SERVICE_ENDPOINTS.bookings, { revalidate: false });
    return rows.map(toBooking);
  },

  /**
   * Moves a booking. The backend validates both the transition and that a provider is allowed to
   * make it, so callers must derive the target from `PROVIDER_TRANSITIONS` rather than guess.
   */
  transition: (bookingId: string, status: string, note?: string | null) =>
    apiFetch<unknown>(SERVICE_ENDPOINTS.bookingTransition(bookingId), {
      method: "POST",
      body: { status, note: note ?? null },
    }),

  async quotationsForProvider(): Promise<Quotation[]> {
    const rows = await apiFetch<QuotationRead[]>(SERVICE_ENDPOINTS.vendorQuotations, { revalidate: false });
    return rows.map(toQuotation);
  },

  async myQuotations(): Promise<Quotation[]> {
    const rows = await apiFetch<QuotationRead[]>(SERVICE_ENDPOINTS.quotations, { revalidate: false });
    return rows.map(toQuotation);
  },

  /** Provider replies to an enquiry with a price. */
  sendQuote: (quotationId: string, input: { amount: number; message?: string | null; durationMinutes?: number | null }) =>
    apiFetch<unknown>(SERVICE_ENDPOINTS.vendorQuotationSend(quotationId), {
      method: "POST",
      body: {
        quoted_amount: input.amount,
        provider_message: input.message ?? null,
        estimated_duration_minutes: input.durationMinutes ?? null,
      },
    }),
};

/* ---------- Slots, quotes, booking creation and escrow ---------- */

type SlotRead = { start_at: string; end_at: string };

type QuoteRead = {
  currency: string;
  base_amount: number;
  addons_amount: number;
  total_amount: number;
  deposit_amount: number;
  due_now: number;
  duration_minutes: number;
  addons?: { title: string; unit_price: number; quantity: number }[];
};

type HoldRead = {
  amount_held: number;
  work_completed_at?: string | null;
  auto_release_at?: string | null;
  customer_confirmed_at?: string | null;
  released_at?: string | null;
  release_reason?: string | null;
  awaiting_confirmation?: boolean;
};

const draftBody = (draft: BookingDraft) => ({
  package_id: draft.packageId ?? null,
  addons: (draft.addons ?? []).map((a) => ({ addon_id: a.addonId, quantity: a.quantity })),
  start_at: draft.startAt ?? null,
  location_mode: draft.locationMode ?? null,
  location_address: draft.locationAddress ?? null,
  location_city: draft.locationCity ?? null,
  customer_note: draft.customerNote ?? null,
  hours: draft.hours ?? null,
});

export const bookingFlowService = {
  /** Bookable times on one day. Empty means the provider has nothing free, not an error. */
  async slots(serviceId: string, day: string, draft: BookingDraft = {}): Promise<BookingSlot[]> {
    const query: Record<string, string | number> = { day };
    if (draft.packageId) query.package_id = draft.packageId;
    if (draft.hours) query.hours = draft.hours;
    const rows = await apiFetch<SlotRead[]>(SERVICE_ENDPOINTS.serviceSlots(serviceId), {
      auth: false,
      query,
      revalidate: false,
    });
    return rows.map((r) => ({ startAt: r.start_at, endAt: r.end_at }));
  },

  /**
   * What a configuration costs. The API calls this advisory and reprices when the booking is
   * written, so it is shown as an estimate and never used to decide what was charged.
   */
  async quote(serviceId: string, draft: BookingDraft): Promise<BookingQuote> {
    const q = await apiFetch<QuoteRead>(SERVICE_ENDPOINTS.serviceQuote(serviceId), {
      auth: false,
      method: "POST",
      body: draftBody(draft),
      revalidate: false,
    });
    return {
      currency: q.currency,
      baseAmount: q.base_amount,
      addonsAmount: q.addons_amount,
      totalAmount: q.total_amount,
      dueNow: q.due_now,
      durationMinutes: q.duration_minutes,
      addons: (q.addons ?? []).map((a) => ({ title: a.title, unitPrice: a.unit_price, quantity: a.quantity })),
    };
  },

  /** Creates the booking. Requires a session: it belongs to the signed-in customer. */
  async create(serviceId: string, draft: BookingDraft): Promise<Booking> {
    const row = await apiFetch<BookingRead>(`${SERVICE_ENDPOINTS.service(serviceId)}/bookings`, {
      method: "POST",
      body: draftBody(draft),
      revalidate: false,
    });
    return toBooking(row);
  },

  /** Opens a gateway checkout for the full booking amount. Returns where to send the customer. */
  async checkout(bookingId: string): Promise<{ checkoutUrl: string | null; reference: string | null }> {
    const row = await apiFetch<{ checkout_url?: string | null; reference?: string | null }>(
      `${SERVICE_ENDPOINTS.booking(bookingId)}/checkout`,
      { method: "POST", revalidate: false },
    );
    return { checkoutUrl: row.checkout_url ?? null, reference: row.reference ?? null };
  },

  /**
   * Confirms a payment by reference. The gateway is the authority — the UI never marks a booking
   * paid on its own, it asks the backend to go and check.
   */
  verifyPayment: (reference: string) =>
    apiFetch<unknown>(`/bookings/payments/${encodeURIComponent(reference)}/verify`, {
      method: "POST",
      revalidate: false,
    }),

  /** The customer releasing the held payment once the work is actually done. */
  async confirmWork(bookingId: string): Promise<Booking> {
    const row = await apiFetch<BookingRead>(`${SERVICE_ENDPOINTS.booking(bookingId)}/confirm`, {
      method: "POST",
      revalidate: false,
    });
    return toBooking(row);
  },

  /** What ODOS is holding on this booking, and when it leaves. */
  async hold(bookingId: string): Promise<BookingHold> {
    const h = await apiFetch<HoldRead>(`${SERVICE_ENDPOINTS.booking(bookingId)}/hold`, { revalidate: false });
    return {
      amountHeld: h.amount_held,
      workCompletedAt: h.work_completed_at ?? null,
      autoReleaseAt: h.auto_release_at ?? null,
      customerConfirmedAt: h.customer_confirmed_at ?? null,
      releasedAt: h.released_at ?? null,
      releaseReason: h.release_reason ?? null,
      awaitingConfirmation: Boolean(h.awaiting_confirmation),
    };
  },
};
