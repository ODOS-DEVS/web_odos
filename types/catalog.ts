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
  storeId: string;
  /** Short name shown on the card, e.g. "Weekend offer". */
  label: string;
  amountOff: number;
  minSpend: number;
  expiresAt: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  vendorReply: string | null;
};
