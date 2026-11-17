/**
 * The service marketplace: providers offer work rather than stock.
 *
 * A store declares what it does through `offerings` — `["products"]`, `["services"]` or both —
 * so a single vendor account can sell goods, offer services, or both without a second login.
 */
export type StoreOffering = "products" | "services";

/** Admin-managed taxonomy, one level of nesting. Never hardcoded: the admin dashboard owns it. */
export type ServiceCategory = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
};

/** How the price works. `quote` means the figure shown is indicative until the provider replies. */
export type ServicePricingModel = "fixed" | "hourly" | "quote" | string;

/** `request` needs the provider to accept; `instant` books a slot outright. */
export type ServiceBookingType = "request" | "instant" | string;

export type ServiceSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  storeId: string;
  categoryId: string | null;
  pricingModel: ServicePricingModel;
  bookingType: ServiceBookingType;
  basePrice: number;
  currency: string;
  durationMinutes: number | null;
  locationModes: string[];
  rating: number | null;
  reviewCount: number;
  imageUrl: string | null;
};

export type ServicePackage = {
  id: string;
  /** `title` on the wire, not `name`. */
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number | null;
  inclusions: string[];
};

export type ServiceAddon = {
  id: string;
  /** `title` on the wire, not `name`. */
  name: string;
  description: string | null;
  price: number;
  maxQuantity: number;
};

export type ServiceDetail = ServiceSummary & {
  description: string | null;
  paymentTiming: string;
  serviceAreas: string[];
  leadTimeHours: number;
  maxAdvanceDays: number;
  requirementsNote: string | null;
  cancellationPolicy: string | null;
  bookingCount: number;
  packages: ServicePackage[];
  addons: ServiceAddon[];
  images: string[];
  /** Images the provider flagged as portfolio work, with their captions. */
  portfolio: { url: string; caption: string | null }[];
};

/** What a provider sends when creating or editing a listing. */
export type ServiceInput = {
  title: string;
  summary?: string | null;
  description?: string | null;
  categoryId?: string | null;
  pricingModel: ServicePricingModel;
  bookingType: ServiceBookingType;
  basePrice: number;
  durationMinutes?: number | null;
  locationModes?: string[];
  serviceAreas?: string[];
  requirementsNote?: string | null;
  cancellationPolicy?: string | null;
};

/* ---------- Bookings and quotations ---------- */

/** The nine states a booking moves through. Mirrors `TRANSITIONS` in the backend state machine. */
export type BookingStatus =
  | "pending_provider"
  | "pending_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "declined"
  | "expired"
  | "disputed";

export type Booking = {
  id: string;
  bookingNumber: string;
  serviceId: string;
  storeId: string;
  status: BookingStatus;
  bookingType: string;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  locationMode: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  customerNote: string | null;
  currency: string;
  baseAmount: number;
  addonsAmount: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  paymentDeadlineAt: string | null;
};

export type QuotationStatus = "requested" | "quoted" | "accepted" | "declined" | "expired" | string;

export type Quotation = {
  id: string;
  reference: string;
  serviceId: string;
  storeId: string;
  status: QuotationStatus;
  customerBrief: string;
  preferredDate: string | null;
  locationMode: string | null;
  locationCity: string | null;
  quotedAmount: number | null;
  currency: string;
  providerMessage: string | null;
  estimatedDurationMinutes: number | null;
  expiresAt: string | null;
  bookingId: string | null;
  createdAt: string;
};
