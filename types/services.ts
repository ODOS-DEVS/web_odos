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
/**
 * How the money is taken. Only these two exist: `upfront` is the escrow model (customer pays in
 * full, ODOS holds it until the work is confirmed) and `free` is for consultations and
 * quote-first work where nothing is charged at booking.
 */
export type ServicePaymentTiming = "upfront" | "free";

export type ServiceInput = {
  title: string;
  paymentTiming?: ServicePaymentTiming;
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

/* ---------- Booking creation, pricing and escrow ---------- */

export type BookingSlot = { startAt: string; endAt: string };

export type PricedAddon = { title: string; unitPrice: number; quantity: number };

/**
 * What a configuration costs. **Advisory**: the API reprices on write, so this is for showing
 * the shopper a figure before they commit — never for deciding what they actually pay.
 */
export type BookingQuote = {
  currency: string;
  baseAmount: number;
  addonsAmount: number;
  totalAmount: number;
  dueNow: number;
  durationMinutes: number;
  addons: PricedAddon[];
};

export type BookingDraft = {
  packageId?: string | null;
  addons?: { addonId: string; quantity: number }[];
  startAt?: string | null;
  locationMode?: string | null;
  locationAddress?: string | null;
  locationCity?: string | null;
  customerNote?: string | null;
  hours?: number | null;
};

/**
 * What ODOS is holding on a booking, and when it leaves.
 *
 * The customer pays in full at booking and the money sits as provider liability until one of
 * three things happens: the customer confirms, the grace window elapses after the provider
 * claimed completion, or an admin resolves a dispute. A provider marking work `completed` is a
 * claim, not a release — which is the entire point of the hold.
 */
export type BookingHold = {
  amountHeld: number;
  workCompletedAt: string | null;
  autoReleaseAt: string | null;
  customerConfirmedAt: string | null;
  releasedAt: string | null;
  releaseReason: string | null;
  /** Provider says it's done and the money has not moved yet. */
  awaitingConfirmation: boolean;
};

/* ---------- Availability ---------- */

/**
 * One open window on one weekday. `weekday` follows Python's `date.weekday()`, which the backend
 * compares against directly: **0 is Monday**, 6 is Sunday. Getting this wrong silently shifts a
 * provider's whole week.
 */
export type AvailabilityRule = {
  id?: string;
  weekday: number;
  /** "HH:MM" — the API takes a time, not a datetime. */
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

/** A one-off override: a closed day, or different hours on a specific date. */
export type AvailabilityException = {
  exceptionDate: string;
  isAvailable: boolean;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
};

/** 0-indexed from Monday, matching `AvailabilityRule.weekday`. */
export const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
