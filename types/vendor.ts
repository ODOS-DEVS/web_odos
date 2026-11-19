/**
 * Every state a vendor product can be in. Only `active` is visible on the storefront.
 *
 * `pending` is the important one: the API sets a product back to `pending` on **every** edit, so
 * a saved change takes it off sale until ODOS re-approves it. Collapsing these into
 * active/draft (as this type used to) reported suspended and under-review products as live.
 */
export type VendorProductStatus =
  | "active"
  | "hidden"
  | "pending"
  | "out_of_stock"
  | "suspended"
  /** Legacy rows only; not reachable through the current API. */
  | "draft";

/**
 * The only two a vendor may set themselves (`VENDOR_SELF_SERVICE_PRODUCT_STATUSES`). The API
 * also gates the transition: hiding needs the product live or out of stock, and republishing
 * needs it hidden/out-of-stock *and* in stock.
 */
export type VendorProductSelfServiceStatus = "active" | "hidden";

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
  size: string | null;
  color: string | null;
};

/**
 * The seven statuses a vendor package moves through. Distinct from the shopper's
 * `FulfilmentStatus`, which flattens `processing` and `ready` into one value and so cannot
 * express the single-step transitions the API requires. See `libs/vendor-orders.ts`.
 */
export type VendorOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type VendorOrderEvent = {
  id: string;
  status: string;
  label: string;
  /** "vendor" | "customer" | "admin" | "system" — who moved the order. */
  actorRole: string | null;
  note: string | null;
  occurredAt: string;
};

/**
 * One order as its vendor sees it.
 *
 * Every status and money field describes **this shop's package**, not the whole order: on a
 * shared cart the order-level roll-up reports the slowest shop, which would tell a vendor who
 * dispatched an hour ago that their items are still being packed.
 */
export type VendorOrder = {
  id: string;
  number: string;
  packageNumber: number;
  /** How many shops are on this order, so the UI can say "1 of 3". */
  packageCount: number;
  placedAt: string;
  paidAt: string | null;
  buyerName: string;
  /** The API exposes a phone for the buyer, never an email. */
  buyerPhone: string | null;
  address: { street: string | null; city: string | null; region: string | null };
  status: VendorOrderStatus;
  deliveryStatus: string;
  deliveryMethod: string | null;
  deliveryInstructions: string | null;
  paymentLabel: string | null;
  items: VendorOrderItem[];
  productCount: number;
  /** Paid to the vendor for delivering their own package, and never commissioned. */
  deliveryFee: number;
  total: number;
  grossAmount: number | null;
  commissionAmount: number | null;
  netAmount: number | null;
  currency: string;
  isSettled: boolean;
  deliveryProblem: string | null;
  dispatchPhotoUrl: string | null;
  departureNotifiedAt: string | null;
  rescheduleRequestedAt: string | null;
  rescheduleNote: string | null;
  timeline: VendorOrderEvent[];
};

export type VendorTopProduct = {
  productId: string;
  /** `product_title` on the wire, not `name`. */
  name: string;
  imageUrl: string | null;
  unitsSold: number;
  /** `gross_sales` on the wire, not `revenue`. */
  revenue: number;
};

/** Only these three windows are accepted; anything else is a 400 from the API. */
export type VendorAnalyticsPeriod = "7d" | "30d" | "90d";

export type VendorDailyPoint = { date: string; sales: number; orders: number };

/** Sales over a window, with the per-day series behind the trend charts. */
export type VendorAnalytics = {
  currency: string;
  period: VendorAnalyticsPeriod;
  todaySales: number;
  todayOrders: number;
  weekSales: number;
  weekOrders: number;
  periodSales: number;
  periodOrders: number;
  openReturns: number;
  topProducts: VendorTopProduct[];
  dailyPoints: VendorDailyPoint[];
};

/**
 * Whole-business counters from `GET /vendor/dashboard`, computed server-side across the full
 * catalogue and order history rather than off whatever page of orders the client happens to hold.
 */
export type VendorDashboard = {
  storeName: string;
  vendorStatus: string;
  totalProducts: number;
  activeProducts: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
  todaySales: number;
  todayOrders: number;
  lowStockCount: number;
  outOfStockCount: number;
  avgRating: number | null;
  reviewCount: number;
  customerCount: number;
  currency: string;
  availableBalance: number;
  pendingWithdrawalBalance: number;
  lifetimeEarnings: number;
  totalCommission: number;
  activeVoucherCount: number;
  isOnVacation: boolean;
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

/* ---------- Store profile, merchandising and delivery ---------- */

/** Seven days of opening hours, stored as JSON on the store record. */
export type BusinessHours = Record<string, { open: string; close: string; closed: boolean }>;

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/** The full editable store record. `SellerProfile` is the read-only subset the shell shows. */
export type VendorStoreProfile = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  marketId: string | null;
  location: string | null;
  phone: string | null;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  twitterUrl: string | null;
  whatsappUrl: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  isOnVacation: boolean;
  vacationMessage: string | null;
  businessHours: BusinessHours | null;
  audienceSlugs: string[];
};

/**
 * The store PATCH is a whole-record write, like the product one.
 *
 * `update_vendor_store` assigns **every** field unconditionally — `store.latitude = latitude`,
 * `store.market_id = market.id if market else None` and so on — so a field left out of the
 * payload is not "unchanged", it is *cleared*. That is why the coordinates, market and audience
 * slugs are part of this type even though no input edits them: the form round-trips them back
 * so a save never silently drops the store's pin on the map.
 */
export type VendorStoreUpdate = {
  name: string;
  description: string;
  category: string;
  region: string;
  city: string;
  /** Round-tripped, not edited — omitting it clears the store's market. */
  marketId?: string | null;
  /** Round-tripped, not edited — omitting these clears the store's map pin. */
  latitude?: number | null;
  longitude?: number | null;
  audienceSlugs?: string[];
  location?: string | null;
  phone?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  twitterUrl?: string | null;
  whatsappUrl?: string | null;
  websiteUrl?: string | null;
  isOnVacation?: boolean;
  vacationMessage?: string | null;
  businessHours?: BusinessHours | null;
  logo?: File | null;
  banner?: File | null;
};

/**
 * Delivery pricing. `null` on an override means "not set — the platform default applies";
 * zero is a real price meaning free, not a clear.
 */
export type VendorDeliverySettings = {
  economyFee: number | null;
  expressFee: number | null;
  sameDayFee: number | null;
  freeDeliveryThreshold: number | null;
  expressEnabled: boolean;
  sameDayEnabled: boolean;
  defaultEconomyFee: number;
  defaultExpressFee: number;
  defaultSameDayFee: number;
  defaultFreeDeliveryThreshold: number;
  badge: string | null;
  /** Server-enforced ceilings — a save above either is rejected with a 400. */
  maxFee: number;
  maxFreeDeliveryThreshold: number;
  /** True once the shop has overridden at least one platform default. */
  isCustom: boolean;
};

export type VendorStoreSection = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};

export type VendorFlashNomination = {
  id: string;
  eventId: string | null;
  eventTitle: string | null;
  productId: string;
  productTitle: string | null;
  productImageUrl: string | null;
  proposedPrice: number | null;
  proposedOldPrice: number | null;
  stockLimit: number | null;
  unitsSold: number | null;
  unitsRemaining: number | null;
  maxPerUser: number | null;
  vendorNote: string | null;
  /** ODOS reviews every nomination: "pending" | "approved" | "rejected". */
  status: string;
  reviewNotes: string | null;
  createdAt: string;
};

export type MerchandisingOptIn = {
  id: string;
  campaignId: string;
  campaignTitle: string | null;
  productId: string | null;
  status: string;
  createdAt: string;
};


/* ---------- Campaign participation ---------- */

/**
 * A campaign as its vendor submission page needs it: identity plus the rules that govern
 * nominating into it. `acceptsSubmissions` is a different question from whether shoppers can
 * see the campaign — a seasonal sale collects nominations weeks before it opens, and stops
 * collecting them before it closes.
 */
export type CampaignBrief = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  bannerImageUrl: string | null;
  thumbnailImageUrl: string | null;
  themeColor: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  submissionDeadline: string | null;
  /** The effective close: the explicit deadline, or the campaign end when there is none. */
  submissionClosesAt: string | null;
  acceptsSubmissions: boolean;
  requiresProposedPrice: boolean;
  minDiscountPercent: number | null;
  maxProducts: number | null;
  productCount: number;
};

export type VendorCampaignSubmission = {
  id: string;
  campaignId: string;
  productId: string;
  productTitle: string;
  productImageUrl: string | null;
  /** The product's shelf price today, for comparison with what was proposed. */
  currentPrice: number | null;
  proposedPrice: number | null;
  proposedOldPrice: number | null;
  discountPercent: number | null;
  vendorNote: string | null;
  /** "pending" | "approved" | "rejected". */
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignWorkspace = {
  campaign: CampaignBrief;
  submissions: VendorCampaignSubmission[];
};

/** Per-product verdicts: one bad item in a batch must not hide the rest. */
export type CampaignSubmissionResult = {
  campaignSlug: string;
  submitted: number;
  rejected: number;
  outcomes: {
    productId: string;
    accepted: boolean;
    reason: string | null;
    detail: string | null;
  }[];
};
