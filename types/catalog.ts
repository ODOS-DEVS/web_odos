/**
 * UI-level catalogue models, built from the API's wire shapes by `services/mappers.ts`.
 * Components use these; only the services know the backend's field names.
 */

export type Category = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  subcategories: string[];
};

export type Store = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  rating: number;
  city: string | null;
  region: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  whatsappUrl: string | null;
  /** Vendor-provided headline such as "Free delivery". */
  deliveryBadge: string | null;
  /** Lowest delivery fee this vendor charges, when known. */
  deliveryFeeFrom: number | null;
  isOnVacation: boolean;
  vacationMessage: string | null;
  marketSlug: string | null;
};

/** A physical market a vendor trades in, e.g. "Kaneshie Market". */
export type Market = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
};

/** A merchandising banner the team schedules in the admin. */
export type PromoBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  /** Vendor-chosen accent colour, when set. */
  accent: string | null;
  sortOrder: number;
};

/** A merchandising campaign — the real source for the home page's deal banner. */
export type Campaign = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  bannerImageUrl: string | null;
  isFeatured: boolean;
  displayPriority: number;
  productCount: number;
};

/** A campaign plus the products in it, from `GET /catalog/campaigns/{slug}`. */
export type CampaignDetail = Campaign & {
  products: Product[];
  hasMore: boolean;
};

export type ProductTag = "new" | "popular" | "flash";

export type FlashSale = {
  endsAt: string | null;
  unitsRemaining: number | null;
  eventTitle: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  /** Vendor-facing label such as "18% off". */
  discountLabel: string | null;
  storeId: string | null;
  categoryName: string;
  categorySlugs: string[];
  subcategory: string | null;
  rating: number;
  reviewCount: number;
  stock: number;
  images: string[];
  colors: string[];
  sizes: string[];
  specifications: string[];
  tags: ProductTag[];
  flashSale: FlashSale | null;
  createdAt: string;
};

export type Voucher = {
  id: string;
  code: string;
  storeId: string | null;
  storeName: string | null;
  /** Short name shown on the card, e.g. "Weekend offer". */
  title: string;
  description: string | null;
  /** Display-ready reward, e.g. "GH₵10 off" or "15% off" — formatted by the backend. */
  rewardText: string;
  minSpend: number;
  /** Null when the offer has no end date. */
  expiresAt: string | null;
  /** True once this shopper has claimed it into their wallet. */
  claimed: boolean;
  issuerName: string | null;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  vendorReply: string | null;
};
