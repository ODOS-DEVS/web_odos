import type { FulfilmentStatus } from "./order";

export type VendorProductStatus = "active" | "draft";

/**
 * A product as its own vendor sees it.
 *
 * `imageUrls` matters beyond display: `PATCH /vendor/products/{id}` is a whole-record write, and the
 * backend reads a present-but-empty `image_urls` as "clear the gallery". Every update therefore has
 * to send the gallery back, which is why the full record is kept here rather than just the cover.
 */
export type VendorProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string | null;
  subcategory: string | null;
  /** Whole cedis. The API's price fields are integers end to end. */
  price: number;
  compareAtPrice: number | null;
  stock: number;
  availableStock: number;
  imageKey: string;
  imageUrl: string | null;
  imageUrls: string[];
  placementTags: string[];
  colorOptions: string[];
  sizeOptions: string[];
  specifications: string[];
  isReturnable: boolean;
  status: VendorProductStatus;
  updatedAt: string;
};

export type VendorOrderItem = {
  id: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
};

export type VendorOrder = {
  id: string;
  number: string;
  placedAt: string;
  buyerName: string;
  /** The API exposes a phone for the buyer, never an email. */
  buyerPhone: string | null;
  address: { street: string | null; city: string | null; region: string | null };
  status: FulfilmentStatus;
  /** Raw vendor-facing status, kept for the labels the normalised set would flatten. */
  rawStatus: string;
  paymentLabel: string | null;
  items: VendorOrderItem[];
  deliveryFee: number;
  total: number;
  netAmount: number | null;
  isSettled: boolean;
  deliveryProblem: string | null;
};

export type VendorTopProduct = {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
};

/** Headline numbers for the seller dashboard. */
export type SellerStats = {
  storeName: string;
  todaySales: number;
  todayOrders: number;
  weekSales: number;
  weekOrders: number;
  openReturns: number;
  /** Derived from the order list: the API has no single count for these. */
  awaitingConfirmation: number;
  awaitingShipment: number;
  fulfilledPercent: number;
  topProducts: VendorTopProduct[];
};

export type SellerProfile = {
  storeName: string;
  slug: string;
  description: string;
  category: string;
  phone: string | null;
  address: string | null;
  city: string;
  region: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  isOnVacation: boolean;
  whatsappUrl: string | null;
  websiteUrl: string | null;
};

export type VendorCustomer = {
  key: string;
  name: string;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};
