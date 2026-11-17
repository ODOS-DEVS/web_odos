import { SERVICE_ENDPOINTS } from "@/libs/api-endpoint";
import type {
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
  packages?: { id: string; name: string; description?: string | null; price: number; duration_minutes?: number | null }[];
  addons?: { id: string; name: string; description?: string | null; price: number }[];
  images?: { image_url?: string | null }[];
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
  name: p.name,
  description: p.description ?? null,
  price: p.price,
  durationMinutes: p.duration_minutes ?? null,
});

const toAddon = (a: NonNullable<DetailRead["addons"]>[number]): ServiceAddon => ({
  id: a.id,
  name: a.name,
  description: a.description ?? null,
  price: a.price,
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
  images: (d.images ?? []).map((i) => i.image_url).filter((url): url is string => Boolean(url)),
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
    base_price: input.basePrice,
    duration_minutes: input.durationMinutes,
    location_modes: input.locationModes,
    service_areas: input.serviceAreas,
    requirements_note: input.requirementsNote,
    cancellation_policy: input.cancellationPolicy,
  };
}
