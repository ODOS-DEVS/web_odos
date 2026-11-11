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

/* ---------- Returns, reviews, vouchers, wallet (the seller-ops surface) ---------- */

export type VendorReturn = {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productTitle: string;
  productImageUrl: string | null;
  customerName: string;
  /** "refund" | "exchange" | anything the API grows later. */
  requestType: string;
  status: string;
  quantity: number;
  reason: string;
  details: string | null;
  evidenceImageUrls: string[];
  adminNote: string | null;
  refundAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type VendorReview = {
  id: string;
  productId: string;
  productTitle: string;
  productImageUrl: string | null;
  rating: number;
  comment: string;
  customerName: string;
  isHidden: boolean;
  vendorReply: string | null;
  vendorRepliedAt: string | null;
  createdAt: string;
};

export type VendorVoucher = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  issuerName: string | null;
  /** "auto" | "claim" | "assigned" */
  availability: string;
  rewardText: string;
  /** "percent" | "fixed" */
  discountType: string;
  discountValue: number;
  minSubtotal: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  status: string;
  redemptionCount: number;
  uniqueUserCount: number;
  totalDiscountAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  /** "approved" | "pending" | "rejected" — ODOS reviews vendor promotions. */
  approvalStatus: string;
  reviewNotes: string | null;
  createdAt: string;
};

/** The full upsert payload. The PATCH is a whole-record write, so edits must send every field. */
export type VendorVoucherInput = {
  code: string;
  title: string;
  description: string | null;
  availability: string;
  discountType: string;
  discountValue: number;
  minSubtotal: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export type VendorWalletTransaction = {
  id: string;
  kind: string;
  title: string;
  amount: number;
  grossAmount: number | null;
  commissionAmount: number | null;
  balanceAfter: number;
  createdAt: string;
};

export type VendorWithdrawal = {
  id: string;
  status: string;
  amount: number;
  note: string | null;
  adminNote: string | null;
  payoutMethodType: string;
  payoutAccountName: string;
  payoutAccountNumberMasked: string;
  payoutProvider: string | null;
  transferFailureReason: string | null;
  createdAt: string;
};

export type VendorWallet = {
  currency: string;
  availableBalance: number;
  pendingWithdrawalBalance: number;
  lifetimeEarnings: number;
  totalWithdrawn: number;
  totalCommission: number;
  commissionRate: number;
  payoutMethodType: string | null;
  payoutAccountName: string | null;
  payoutAccountNumberMasked: string | null;
  payoutProvider: string | null;
  recentTransactions: VendorWalletTransaction[];
  withdrawalRequests: VendorWithdrawal[];
};

export type VendorPayoutInstitution = {
  code: string;
  name: string;
  payoutMethodType: string;
  currency: string;
};

export type VendorPayoutDetailsInput = {
  payoutMethodType: "mobile_money" | "bank_transfer";
  payoutAccountName: string;
  payoutAccountNumber: string;
  payoutProvider: string;
};

/** Sales over a window for one SKU; a product absent from the response simply sold nothing. */
export type VendorProductPerformance = {
  productId: string;
  unitsSold: number;
  grossSales: number;
  orderCount: number;
  lastSoldAt: string | null;
};

export type VendorInventoryMovement = {
  id: string;
  productId: string;
  productTitle: string;
  /** Signed stock change: sales negative, restocks positive. */
  delta: number;
  stockAfter: number;
  reason: string;
  note: string | null;
  createdAt: string;
};
