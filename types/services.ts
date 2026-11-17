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
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number | null;
};

export type ServiceAddon = {
  id: string;
  name: string;
  description: string | null;
  price: number;
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
