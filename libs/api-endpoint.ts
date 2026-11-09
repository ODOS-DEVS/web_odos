import CONFIG from "@/utils/config";

/** Server render calls the backend origin directly; the browser calls the same-origin proxy. See `CONFIG`. */
export function apiBaseUrl() {
  return typeof window === "undefined" ? `${CONFIG.API_BASE_URL}${CONFIG.API_PREFIX}` : CONFIG.API_PREFIX;
}

/** Ids come from the API, but never trust them inside a URL path. */
const enc = encodeURIComponent;

// Platform

/** Liveness probes — public, no token. */
export const HEALTH_ENDPOINTS = {
  health: "/health",
  services: "/health/services",
  payments: "/health/payments",
  database: "/db-health",
} as const;

// Session and identity

export const AUTH_ENDPOINTS = {
  login: "/auth/login",
  signup: "/auth/signup",
  google: "/auth/google",
  logout: "/auth/logout",
  forgotPassword: "/auth/forgot-password",
  verifyResetCode: "/auth/verify-reset-code",
  resetPassword: "/auth/reset-password",
} as const;

/**
 * Endpoints that create a session or don't need one. Tokens are omitted from these requests so a stale
 * token can't get valid credentials rejected.
 */
export const UNAUTHENTICATED_ENDPOINTS: string[] = [
  AUTH_ENDPOINTS.login,
  AUTH_ENDPOINTS.signup,
  AUTH_ENDPOINTS.google,
  AUTH_ENDPOINTS.forgotPassword,
  AUTH_ENDPOINTS.verifyResetCode,
  AUTH_ENDPOINTS.resetPassword,
];

export const ALL_AUTH_ENDPOINTS: string[] = Object.values(AUTH_ENDPOINTS);

/**
 * Identity reads and verification for the signed-in user. These need the access token like any other
 * private request (never add them to `UNAUTHENTICATED_ENDPOINTS`) and, unlike the session endpoints
 * above, a 401 from one of them means the session is over (never add them to `ALL_AUTH_ENDPOINTS`).
 * Email and phone verification are separate flows; codes expire after 10 minutes.
 * `me` serves both `GET` (read) and `PATCH` (update profile).
 */
export const IDENTITY_ENDPOINTS = {
  me: "/auth/me",
  verifyEmail: "/auth/verify-email",
  resendVerificationCode: "/auth/resend-verification-code",
  phoneSendCode: "/auth/phone/send-code",
  phoneVerify: "/auth/phone/verify",
  phoneVerified: "/auth/phone/verified",
} as const;

/**
 * Saved delivery addresses, payment methods, email preferences and account deletion.
 * `account` takes `DELETE` only — check `deletionEligibility` first.
 */
export const ACCOUNT_ENDPOINTS = {
  account: "/account",
  addresses: "/account/addresses",
  address: (addressId: string) => `/account/addresses/${enc(addressId)}`,
  addressDefault: (addressId: string) =>
    `/account/addresses/${enc(addressId)}/default`,
  paymentMethods: "/account/payment-methods",
  paymentMethod: (paymentMethodId: string) =>
    `/account/payment-methods/${enc(paymentMethodId)}`,
  paymentMethodDefault: (paymentMethodId: string) =>
    `/account/payment-methods/${enc(paymentMethodId)}/default`,
  emailPreferences: "/account/email-preferences",
  deletionEligibility: "/account/deletion-eligibility",
} as const;

// Catalogue

/**
 * Public browsing. Two things differ from what the URLs suggest:
 * - a store is fetched by its **id**, never its slug (`/catalog/stores/{slug}` is a 404), so slug routes
 *   resolve the id from the cached store list first;
 * - a product has no slug at all — product pages are addressed by id.
 * `products` accepts `limit` up to 100. `search` and `dealsHub` require a login.
 */
export const CATALOG_ENDPOINTS = {
  categories: "/catalog/categories",
  markets: "/catalog/markets",
  stores: "/catalog/stores",
  store: (storeId: string) => `/catalog/stores/${enc(storeId)}`,
  storeSections: (storeId: string) =>
    `/catalog/stores/${enc(storeId)}/sections`,
  products: "/catalog/products",
  product: (productId: string) => `/catalog/products/${enc(productId)}`,
  search: "/catalog/search",
  dealsHub: "/catalog/deals-hub",
  dealProducts: "/catalog/deal-products",
  promoBanners: "/catalog/promo-banners",
  campaignTags: "/catalog/campaign-tags",
  campaigns: "/catalog/campaigns",
  campaign: (campaignSlug: string) =>
    `/catalog/campaigns/${enc(campaignSlug)}`,
  flashSaleEventsActive: "/catalog/flash-sale-events/active",
  flashSaleProducts: (eventSlug: string) =>
    `/catalog/flash-sale-events/${enc(eventSlug)}/products`,
} as const;

/** Product reviews. Reading is public; posting requires a login and a purchase. */
export const REVIEWS_ENDPOINTS = {
  forProduct: (productId: string) => `/reviews/products/${enc(productId)}`,
  mine: "/reviews/me",
  upsert: "/reviews",
} as const;

/** Personalised feeds (login required). `homeFeed` is defined with a trailing slash by the backend. */
export const FEED_ENDPOINTS = {
  homeFeed: "/home-feed/",
  homeFeedSection: (sectionKey: string) =>
    `/home-feed/section/${enc(sectionKey)}`,
  recommendationsForYou: "/recommendations/for-you",
  recommendationsSimilar: (productId: string) =>
    `/recommendations/similar/${enc(productId)}`,
} as const;

/** How-to videos shown to shoppers and vendors. Public. */
export const GUIDES_ENDPOINTS = {
  videos: "/guides/videos",
} as const;

/** AI shopping assistant. `status` is public; everything else needs a login. `chatStream` is SSE. */
export const ASSISTANT_ENDPOINTS = {
  status: "/assistant/status",
  session: "/assistant/session",
  chat: "/assistant/chat",
  chatStream: "/assistant/chat/stream",
  feedback: "/assistant/feedback",
} as const;

/** Batched client-side tracking (login required). */
export const TRACKING_ENDPOINTS = {
  behaviorEvents: "/behavior/events/batch",
  promoEvents: "/promotions/events/batch",
} as const;

// Shopping

/** Public — quote a delivery fee before checkout. */
export const DELIVERY_ENDPOINTS = {
  quote: "/delivery/quote",
} as const;

/** `cart` serves `GET`, `POST` (add item) and `DELETE` (clear). */
export const CART_ENDPOINTS = {
  cart: "/cart",
  cartItem: (productId: string) => `/cart/${enc(productId)}`,
} as const;

export const WISHLIST_ENDPOINTS = {
  wishlist: "/wishlist",
  wishlistItem: (productId: string) => `/wishlist/${enc(productId)}`,
} as const;

/**
 * Orders are split into one package per vendor: each package has its own `vendor_status`,
 * `delivery_status`, fees and settlement. The order's overall status is the least advanced package.
 */
export const ORDERS_ENDPOINTS = {
  orders: "/orders",
  order: (orderId: string) => `/orders/${enc(orderId)}`,
  cancel: (orderId: string) => `/orders/${enc(orderId)}/cancel`,
  deliver: (orderId: string) => `/orders/${enc(orderId)}/deliver`,
  deliverPackage: (orderId: string, packageId: string) =>
    `/orders/${enc(orderId)}/packages/${enc(packageId)}/deliver`,
  deliveryProblem: (orderId: string) =>
    `/orders/${enc(orderId)}/delivery-problem`,
  deliveryRating: (orderId: string) =>
    `/orders/${enc(orderId)}/delivery-rating`,
  reschedule: (orderId: string) => `/orders/${enc(orderId)}/reschedule`,
  returns: (orderId: string) => `/orders/${enc(orderId)}/returns`,
} as const;

/**
 * Hosted checkout: `checkout` creates the order and a payment session in one call and returns the
 * `authorization_url` to redirect to; `verify` confirms the `reference` when the shopper comes back.
 * The provider webhooks (`/payments/paystack/webhook`, `/payments/kutanapay/webhook`) and the
 * `/payments/paystack/redirect` landing are server-to-server / provider-driven and are deliberately
 * not modelled here.
 */
export const PAYMENTS_ENDPOINTS = {
  checkout: "/payments/checkout",
  verify: (reference: string) =>
    `/payments/checkout/${enc(reference)}/verify`,
  kutanapayCheckout: "/payments/kutanapay/checkout",
} as const;

/** Direct payment-method flow (login required): list what's available, start, then confirm. */
export const PAYMENT_METHODS_ENDPOINTS = {
  available: "/payment-methods/available",
  initiate: "/payment-methods/initiate",
  verify: "/payment-methods/verify",
} as const;

// Rewards and engagement (login required)

export const WALLET_ENDPOINTS = {
  wallet: "/wallet/customer",
  topupCheckout: "/wallet/customer/topups/checkout",
  topupVerify: (reference: string) =>
    `/wallet/customer/topups/${enc(reference)}/verify`,
  checkout: "/wallet/customer/checkout",
} as const;

/** `awardBonus` is admin-only. */
export const LOYALTY_ENDPOINTS = {
  account: "/loyalty/account",
  history: "/loyalty/history",
  redeem: "/loyalty/redeem",
  awardBonus: "/loyalty/admin/award",
} as const;

/** `promotions` and `forStore` are public; the rest need a login. */
export const VOUCHERS_ENDPOINTS = {
  promotions: "/vouchers/promotions",
  forStore: (storeId: string) => `/vouchers/stores/${enc(storeId)}`,
  mine: "/vouchers/me",
  claim: (voucherId: string) => `/vouchers/${enc(voucherId)}/claim`,
  preview: "/vouchers/preview",
  calculate: "/vouchers/calculate",
  suggestions: "/vouchers/suggestions",
} as const;

/** `pushToken` serves `POST` (save) and `DELETE` (clear). */
export const NOTIFICATIONS_ENDPOINTS = {
  notifications: "/notifications",
  readState: "/notifications/read-state",
  pushToken: "/notifications/push-token",
} as const;

/** Shopper ↔ vendor and shopper ↔ support chat threads. */
export const CHAT_ENDPOINTS = {
  threads: "/chat/threads",
  storeThread: (storeId: string) => `/chat/threads/store/${enc(storeId)}`,
  supportThread: "/chat/threads/support",
  messages: (threadId: string) => `/chat/threads/${enc(threadId)}/messages`,
  message: (messageId: string) => `/chat/messages/${enc(messageId)}`,
  supportStatus: (threadId: string) =>
    `/chat/threads/${enc(threadId)}/support-status`,
} as const;

// Vendor portal (login required, vendor role)

/** Vendor onboarding, dashboard, customers, reviews, returns and payouts. */
export const VENDOR_ENDPOINTS = {
  applications: "/vendor/applications",
  myApplication: "/vendor/applications/me",
  me: "/vendor/me",
  dashboard: "/vendor/dashboard",
  analytics: "/vendor/analytics",
  customers: "/vendor/customers",
  reviews: "/vendor/reviews",
  reviewReply: (reviewId: string) =>
    `/vendor/reviews/${enc(reviewId)}/reply`,
  returns: "/vendor/returns",
  return: (returnRequestId: string) =>
    `/vendor/returns/${enc(returnRequestId)}`,
  wallet: "/vendor/wallet",
  payoutInstitutions: "/vendor/wallet/payout-institutions",
  payoutDetails: "/vendor/wallet/payout-details",
  withdrawals: "/vendor/wallet/withdrawals",
  deliverySettings: "/vendor/delivery-settings",
} as const;

/** Vendor product catalogue and stock movements. */
export const VENDOR_PRODUCTS_ENDPOINTS = {
  products: "/vendor/products",
  performance: "/vendor/products/performance",
  bulk: "/vendor/products/bulk",
  product: (productId: string) => `/vendor/products/${enc(productId)}`,
  status: (productId: string) => `/vendor/products/${enc(productId)}/status`,
  stock: (productId: string) => `/vendor/products/${enc(productId)}/stock`,
  productInventoryMovements: (productId: string) =>
    `/vendor/products/${enc(productId)}/inventory-movements`,
  inventoryMovements: "/vendor/inventory-movements",
} as const;

/** Stock and price desk — overlaps `VENDOR_PRODUCTS_ENDPOINTS.stock`. `inventory` has a trailing slash. */
export const VENDOR_INVENTORY_ENDPOINTS = {
  inventory: "/vendor/inventory/",
  stats: "/vendor/inventory/stats",
  stock: (productId: string) =>
    `/vendor/inventory/products/${enc(productId)}/stock`,
  price: (productId: string) =>
    `/vendor/inventory/products/${enc(productId)}/price`,
  bulkUpdate: "/vendor/inventory/bulk-update",
  lowStockAlerts: "/vendor/inventory/alerts/low-stock",
} as const;

/** The vendor's side of an order package: acknowledge, update status, hand over to a courier. */
export const VENDOR_ORDERS_ENDPOINTS = {
  orders: "/vendor/orders",
  order: (orderId: string) => `/vendor/orders/${enc(orderId)}`,
  acknowledge: (orderId: string) =>
    `/vendor/orders/${enc(orderId)}/acknowledge`,
  status: (orderId: string) => `/vendor/orders/${enc(orderId)}/status`,
  dispatchPhoto: (orderId: string) =>
    `/vendor/orders/${enc(orderId)}/dispatch-photo`,
  notifyDeparture: (orderId: string) =>
    `/vendor/orders/${enc(orderId)}/notify-departure`,
  requestCourier: (orderId: string) =>
    `/vendor/orders/${enc(orderId)}/request-courier`,
} as const;

/** Vendor storefront profile and its curated sections. */
export const VENDOR_STORE_ENDPOINTS = {
  store: "/vendor/store",
  sections: "/vendor/store/sections",
  sectionSuggestions: "/vendor/store/sections/starter-suggestions",
  sectionsReorder: "/vendor/store/sections/reorder",
  section: (sectionId: string) => `/vendor/store/sections/${enc(sectionId)}`,
  sectionProducts: (sectionId: string) =>
    `/vendor/store/sections/${enc(sectionId)}/products`,
  sectionProduct: (sectionId: string, productId: string) =>
    `/vendor/store/sections/${enc(sectionId)}/products/${enc(productId)}`,
} as const;

/** Vendor vouchers, flash-sale nominations, merchandising opt-ins and own campaigns. */
export const VENDOR_PROMOTIONS_ENDPOINTS = {
  vouchers: "/vendor/vouchers",
  voucher: (voucherId: string) => `/vendor/vouchers/${enc(voucherId)}`,
  voucherGift: (voucherId: string) =>
    `/vendor/vouchers/${enc(voucherId)}/gift`,
  voucherRedemptions: (voucherId: string) =>
    `/vendor/vouchers/${enc(voucherId)}/redemptions`,
  flashSaleNominations: "/vendor/flash-sale-nominations",
  openMerchandisingCampaigns: "/vendor/merchandising-campaigns/open",
  merchandisingCampaignOptIns: "/vendor/merchandising-campaign-opt-ins",
  campaigns: "/vendor/campaigns",
  /** `GET` and `PUT` (full update). */
  campaign: (campaignId: string) => `/vendor/campaigns/${enc(campaignId)}`,
} as const;

export const VENDOR_ANALYTICS_ENDPOINTS = {
  vouchers: "/vendor/analytics/vouchers",
  campaigns: "/vendor/analytics/campaigns",
  promotionsOverview: "/vendor/analytics/promotions/overview",
  promotionsTimeseries: "/vendor/analytics/promotions/timeseries",
  promotionsLeaderboard: "/vendor/analytics/promotions/leaderboard",
} as const;

// Courier app (login required, courier role)

/**
 * Courier profile, the open delivery pool, and the delivery state machine:
 * startPickup → arriveAtPickup → beginPickupVerification → startDropoff → arriveAtCustomer →
 * beginDeliveryVerification. Off-path: reportCustomerUnavailable, failDelivery, startReturn, release.
 */
export const COURIER_ENDPOINTS = {
  me: "/courier/me",
  profile: "/courier/profile",
  status: "/courier/status",
  location: "/courier/location",
  pool: "/courier/pool",
  claimOffer: (offerId: string) => `/courier/pool/${enc(offerId)}/claim`,
  activeDelivery: "/courier/deliveries/active",
  history: "/courier/deliveries/history",
  delivery: (deliveryId: string) => `/courier/deliveries/${enc(deliveryId)}`,
  startPickup: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/start-pickup`,
  arriveAtPickup: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/arrive-at-pickup`,
  beginPickupVerification: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/begin-pickup-verification`,
  startDropoff: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/start-dropoff`,
  arriveAtCustomer: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/arrive-at-customer`,
  beginDeliveryVerification: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/begin-delivery-verification`,
  reportCustomerUnavailable: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/report-customer-unavailable`,
  failDelivery: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/fail-delivery`,
  startReturn: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/start-return`,
  release: (deliveryId: string) =>
    `/courier/deliveries/${enc(deliveryId)}/release`,
} as const;

// Marketing (staff)

export const EMAIL_MARKETING_ENDPOINTS = {
  send: "/email-marketing/send",
  abandonedCartCampaign: "/email-marketing/campaigns/abandoned-cart",
  reengagementCampaign: "/email-marketing/campaigns/reengagement",
  welcomeCampaign: "/email-marketing/campaigns/welcome",
  loyaltyNotification: "/email-marketing/notifications/loyalty",
  templates: "/email-marketing/templates",
} as const;

export const CUSTOMER_SEGMENTATION_ENDPOINTS = {
  overview: "/customer-segmentation/overview",
  churnRisk: "/customer-segmentation/churn-risk",
  user: (userId: string) => `/customer-segmentation/user/${enc(userId)}`,
  segment: (segment: string) =>
    `/customer-segmentation/segment/${enc(segment)}`,
  segmentStats: (segment: string) =>
    `/customer-segmentation/segment/${enc(segment)}/stats`,
  segmentExport: (segment: string) =>
    `/customer-segmentation/segment/${enc(segment)}/export`,
} as const;

// Admin console

/**
 * Admin sessions are separate from shopper sessions. `bootstrapStatus`, `bootstrapSignup` and `login`
 * are public; `me` serves `GET` and `PATCH`.
 */
export const ADMIN_AUTH_ENDPOINTS = {
  bootstrapStatus: "/admin/auth/bootstrap-status",
  bootstrapSignup: "/admin/auth/bootstrap-signup",
  login: "/admin/auth/login",
  me: "/admin/auth/me",
} as const;

export const ADMIN_DASHBOARD_ENDPOINTS = {
  dashboard: "/admin/dashboard",
  salesChart: "/admin/dashboard/sales-chart",
  topVendors: "/admin/dashboard/top-vendors",
  kpiMetrics: "/admin/dashboard/kpi-metrics",
} as const;

export const ADMIN_ANALYTICS_ENDPOINTS = {
  customers: "/admin/analytics/customers",
  revenue: "/admin/analytics/revenue",
  products: "/admin/analytics/products",
  inventory: "/admin/analytics/inventory",
  categories: "/admin/analytics/categories",
  vendors: "/admin/analytics/vendors",
} as const;

/** Users, staff, vendors, vendor applications, stores and markets. */
export const ADMIN_PEOPLE_ENDPOINTS = {
  users: "/admin/users",
  user: (userId: string) => `/admin/users/${enc(userId)}`,
  userStatus: (userId: string) => `/admin/users/${enc(userId)}/status`,
  userPermission: (userId: string) =>
    `/admin/users/${enc(userId)}/permission`,
  staff: "/admin/staff",
  vendors: "/admin/vendors",
  vendor: (vendorId: string) => `/admin/vendors/${enc(vendorId)}`,
  vendorStatus: (vendorId: string) =>
    `/admin/vendors/${enc(vendorId)}/status`,
  vendorApplications: "/admin/vendor-applications",
  vendorApplicationApprove: (applicationId: string) =>
    `/admin/vendor-applications/${enc(applicationId)}/approve`,
  vendorApplicationReject: (applicationId: string) =>
    `/admin/vendor-applications/${enc(applicationId)}/reject`,
  stores: "/admin/stores",
  store: (storeId: string) => `/admin/stores/${enc(storeId)}`,
  storeStatus: (storeId: string) => `/admin/stores/${enc(storeId)}/status`,
  markets: "/admin/markets",
  market: (marketId: string) => `/admin/markets/${enc(marketId)}`,
} as const;

/** Categories, products and review moderation. */
export const ADMIN_CATALOG_ENDPOINTS = {
  categories: "/admin/categories",
  category: (categoryId: string) => `/admin/categories/${enc(categoryId)}`,
  products: "/admin/products",
  product: (productId: string) => `/admin/products/${enc(productId)}`,
  productStatus: (productId: string) =>
    `/admin/products/${enc(productId)}/status`,
  reviews: "/admin/reviews",
  reviewModeration: (reviewId: string) =>
    `/admin/reviews/${enc(reviewId)}/moderation`,
} as const;

/** Promo banners, flash sales and merchandising campaigns. */
export const ADMIN_MERCHANDISING_ENDPOINTS = {
  promoBanners: "/admin/promo-banners",
  promoBanner: (bannerId: string) =>
    `/admin/promo-banners/${enc(bannerId)}`,
  flashSaleEvents: "/admin/flash-sale-events",
  flashSaleEvent: (eventId: string) =>
    `/admin/flash-sale-events/${enc(eventId)}`,
  flashSaleNominations: "/admin/flash-sale-nominations",
  flashSaleNominationReview: (nominationId: string) =>
    `/admin/flash-sale-nominations/${enc(nominationId)}/review`,
  campaigns: "/admin/merchandising-campaigns",
  campaign: (campaignId: string) =>
    `/admin/merchandising-campaigns/${enc(campaignId)}`,
  campaignDuplicate: (campaignId: string) =>
    `/admin/merchandising-campaigns/${enc(campaignId)}/duplicate`,
  campaignOptIns: "/admin/merchandising-campaign-opt-ins",
  campaignOptInReview: (optInId: string) =>
    `/admin/merchandising-campaign-opt-ins/${enc(optInId)}/review`,
} as const;

/** Platform vouchers and promotion analytics. */
export const ADMIN_VOUCHERS_ENDPOINTS = {
  vouchers: "/admin/vouchers",
  voucher: (voucherId: string) => `/admin/vouchers/${enc(voucherId)}`,
  pause: (voucherId: string) => `/admin/vouchers/${enc(voucherId)}/pause`,
  resume: (voucherId: string) => `/admin/vouchers/${enc(voucherId)}/resume`,
  duplicate: (voucherId: string) =>
    `/admin/vouchers/${enc(voucherId)}/duplicate`,
  review: (voucherId: string) => `/admin/vouchers/${enc(voucherId)}/review`,
  bulkGenerate: "/admin/vouchers/bulk-generate",
  analytics: "/admin/vouchers/analytics",
  promoOverview: "/admin/promo-analytics/overview",
  promoTimeseries: "/admin/promo-analytics/timeseries",
  promoLeaderboard: "/admin/promo-analytics/leaderboard",
} as const;

/** Orders, delivery ops, returns, finance and vendor payouts. */
export const ADMIN_OPERATIONS_ENDPOINTS = {
  orders: "/admin/orders",
  deliveryOps: "/admin/orders/delivery-ops",
  order: (orderId: string) => `/admin/orders/${enc(orderId)}`,
  orderStatus: (orderId: string) => `/admin/orders/${enc(orderId)}/status`,
  returns: "/admin/returns",
  return: (requestId: string) => `/admin/returns/${enc(requestId)}`,
  financeOverview: "/admin/finance/overview",
  financeReconciliation: "/admin/finance/reconciliation",
  financePayments: "/admin/finance/payments",
  financeLedger: "/admin/finance/ledger",
  withdrawals: "/admin/payouts/withdrawals",
  withdrawal: (requestId: string) =>
    `/admin/payouts/withdrawals/${enc(requestId)}`,
  deliverySettings: "/admin/delivery-settings",
} as const;

/** Admin notifications, event logs and guide-video management. */
export const ADMIN_SYSTEM_ENDPOINTS = {
  notifications: "/admin/notifications",
  notificationRead: (notificationId: string) =>
    `/admin/notifications/${enc(notificationId)}/read`,
  eventLogs: "/admin/event-logs",
  eventLogStats: "/admin/event-logs/stats",
  guidesCatalog: "/admin/guides/catalog",
  guideVideos: "/admin/guides/videos",
  guideVideo: (videoId: string) => `/admin/guides/videos/${enc(videoId)}`,
  guideVideoUploadSignature: "/admin/guides/videos/upload-signature",
} as const;
