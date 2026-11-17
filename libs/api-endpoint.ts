
import CONFIG from "@/utils/config";

/** Server render calls the backend origin directly; the browser calls the same-origin proxy. See `CONFIG`. */
export function apiBaseUrl() {
  return typeof window === "undefined" ? `${CONFIG.API_BASE_URL}${CONFIG.API_PREFIX}` : CONFIG.API_PREFIX;
}

/** Ids come from the API, but never trust them inside a URL path. */
const enc = encodeURIComponent;


export const AUTH_ENDPOINTS = {
  login: "/auth/login",
  signup: "/auth/signup",
  google: "/auth/google",
  logout: "/auth/logout",
  forgotPassword: "/auth/forgot-password",
  verifyResetCode: "/auth/verify-reset-code",
  resetPassword: "/auth/reset-password",
} as const;

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
 */
export const IDENTITY_ENDPOINTS = {
  me: "/auth/me",
  verifyEmail: "/auth/verify-email",
  resendVerificationCode: "/auth/resend-verification-code",
  phoneSendCode: "/auth/phone/send-code",
  phoneVerify: "/auth/phone/verify",
  phoneVerified: "/auth/phone/verified",
} as const;

/** Saved delivery addresses and payment methods on the shopper's account. */
export const ACCOUNT_ENDPOINTS = {
  addresses: "/account/addresses",
  address: (addressId: string) => `/account/addresses/${enc(addressId)}`,
  addressDefault: (addressId: string) => `/account/addresses/${enc(addressId)}/default`,
  paymentMethods: "/account/payment-methods",
  paymentMethod: (paymentMethodId: string) => `/account/payment-methods/${enc(paymentMethodId)}`,
  paymentMethodDefault: (paymentMethodId: string) => `/account/payment-methods/${enc(paymentMethodId)}/default`,
} as const;

// Catalogue

/**
 * Public browsing. Two things differ from what the URLs suggest:
 * - a store is fetched by its **id**, never its slug (`/catalog/stores/{slug}` is a 404), so slug routes
 *   resolve the id from the cached store list first;
 * - a product has no slug at all — product pages are addressed by id.
 * `products` accepts `limit` up to 100. `dealsHub` requires a login; `search` does not.
 */
export const CATALOG_ENDPOINTS = {
  categories: "/catalog/categories",
  markets: "/catalog/markets",
  stores: "/catalog/stores",
  store: (storeId: string) => `/catalog/stores/${enc(storeId)}`,
  storeSections: (storeId: string) => `/catalog/stores/${enc(storeId)}/sections`,
  products: "/catalog/products",
  product: (productId: string) => `/catalog/products/${enc(productId)}`,
  search: "/catalog/search",
  dealsHub: "/catalog/deals-hub",
  upcomingFlashEvents: "/catalog/flash-sale-events/upcoming",
  myFlashReminders: "/catalog/flash-sale-reminders/me",
  flashReminder: (eventId: string) => `/catalog/flash-sale-events/${enc(eventId)}/reminder`,
  dealProducts: "/catalog/deal-products",
  promoBanners: "/catalog/promo-banners",
  campaigns: "/catalog/campaigns",
  campaign: (campaignSlug: string) => `/catalog/campaigns/${enc(campaignSlug)}`,
  flashSaleEventsActive: "/catalog/flash-sale-events/active",
  flashSaleProducts: (eventSlug: string) => `/catalog/flash-sale-events/${enc(eventSlug)}/products`,
} as const;

/** Product reviews. Reading is public; posting requires a login and a purchase. */
export const REVIEWS_ENDPOINTS = {
  forProduct: (productId: string) => `/reviews/products/${enc(productId)}`,
  mine: "/reviews/me",
  upsert: "/reviews",
} as const;

/** Personalised feeds (login required). `homeFeed.root` is defined with a trailing slash by the backend. */
export const FEED_ENDPOINTS = {
  homeFeed: "/home-feed/",
  homeFeedSection: (sectionKey: string) => `/home-feed/section/${enc(sectionKey)}`,
  recommendationsForYou: "/recommendations/for-you",
  recommendationsSimilar: (productId: string) => `/recommendations/similar/${enc(productId)}`,
} as const;

// Shopping
/**
 * The service marketplace. Browsing is public; everything under `vendor/` belongs to the provider.
 *
 * NOTE: not deployed to production at the time of writing — every one of these 404s against
 * appbe.odos.market until the backend services work ships.
 */
export const SERVICE_ENDPOINTS = {
  categories: "/services/categories",
  services: "/services",
  service: (serviceId: string) => `/services/${enc(serviceId)}`,
  serviceSlots: (serviceId: string) => `/services/${enc(serviceId)}/slots`,
  serviceQuote: (serviceId: string) => `/services/${enc(serviceId)}/quote`,
  bookings: "/bookings",
  booking: (bookingId: string) => `/bookings/${enc(bookingId)}`,
  quotations: "/quotations",
  vendorServices: "/vendor/services",
  vendorService: (serviceId: string) => `/vendor/services/${enc(serviceId)}`,
  vendorServiceStatus: (serviceId: string) => `/vendor/services/${enc(serviceId)}/status`,
  vendorServiceBookings: "/vendor/services/bookings/all",
  vendorQuotations: "/vendor/services/quotations/all",
  vendorQuotationSend: (quotationId: string) => `/vendor/services/quotations/${enc(quotationId)}/send`,
  bookingTransition: (bookingId: string) => `/bookings/${enc(bookingId)}/transition`,
} as const;

/**
 * The ODOS Assistant. `status` and `chat` are deliberately unauthenticated — a signed-out shopper
 * still gets answers and product suggestions; only `session` (the stored thread) needs a login.
 */
export const ASSISTANT_ENDPOINTS = {
  status: "/assistant/status",
  session: "/assistant/session",
  chat: "/assistant/chat",
  feedback: "/assistant/feedback",
} as const;

/** Write-only: what the shopper viewed, which is what fills `recently_viewed` and recommendations. */
export const BEHAVIOR_ENDPOINTS = {
  eventsBatch: "/behavior/events/batch",
} as const;

export const DELIVERY_ENDPOINTS = {
  quote: "/delivery/quote",
} as const;

export const CART_ENDPOINTS = {
  cart: "/cart",
  cartItem: (productId: string) => `/cart/${enc(productId)}`,
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
  deliverPackage: (orderId: string, packageId: string) => `/orders/${enc(orderId)}/packages/${enc(packageId)}/deliver`,
  deliveryProblem: (orderId: string) => `/orders/${enc(orderId)}/delivery-problem`,
  deliveryRating: (orderId: string) => `/orders/${enc(orderId)}/delivery-rating`,
  reschedule: (orderId: string) => `/orders/${enc(orderId)}/reschedule`,
  returns: (orderId: string) => `/orders/${enc(orderId)}/returns`,
} as const;

/**
 * Which gateway collects order payments.
 *
 * KutanaPay is the live collector, same as the mobile app. Paystack stays reachable because a
 * single env var is the fastest way back if a live collection problem has to be rolled back
 * without shipping a build — and because vendor payouts run on Paystack's transfer API either way
 * (KutanaPay's public API covers checkouts only), so this setting does not affect them.
 *
 * Mirrors `constants/payments.ts` in the mobile app; keep the two in step.
 */
export type CollectionsProvider = "kutanapay" | "paystack";

const configuredProvider = process.env.NEXT_PUBLIC_COLLECTIONS_PROVIDER?.trim().toLowerCase();

export const COLLECTIONS_PROVIDER: CollectionsProvider =
  configuredProvider === "paystack" ? "paystack" : "kutanapay";

/**
 * Hosted checkout: creates the order and a payment session in one call and returns the
 * `authorization_url` to redirect to; `verify` confirms the `reference` when the shopper comes
 * back. Verification is provider-agnostic — the API dispatches on the provider that actually took
 * the money, so there is only one verify path.
 *
 * The provider webhooks (`/payments/kutanapay/webhook`, `/payments/paystack/webhook`) are
 * server-to-server callbacks and are deliberately not modelled here.
 */
export const PAYMENTS_ENDPOINTS = {
  checkout: COLLECTIONS_PROVIDER === "kutanapay" ? "/payments/kutanapay/checkout" : "/payments/checkout",
  verify: (reference: string) => `/payments/checkout/${enc(reference)}/verify`,
} as const;

// Rewards and engagement (login required)

export const WALLET_ENDPOINTS = {
  wallet: "/wallet/customer",
  topupCheckout: "/wallet/customer/topups/checkout",
  topupVerify: (reference: string) => `/wallet/customer/topups/${enc(reference)}/verify`,
  checkout: "/wallet/customer/checkout",
} as const;

export const LOYALTY_ENDPOINTS = {
  account: "/loyalty/account",
  history: "/loyalty/history",
  redeem: "/loyalty/redeem",
} as const;

export const WISHLIST_ENDPOINTS = {
  wishlist: "/wishlist",
  wishlistItem: (productId: string) => `/wishlist/${enc(productId)}`,
} as const;

export const VOUCHERS_ENDPOINTS = {
  promotions: "/vouchers/promotions",
  forStore: (storeId: string) => `/vouchers/stores/${enc(storeId)}`,
  mine: "/vouchers/me",
  claim: (voucherId: string) => `/vouchers/${enc(voucherId)}/claim`,
  preview: "/vouchers/preview",
  calculate: "/vouchers/calculate",
} as const;

export const NOTIFICATIONS_ENDPOINTS = {
  notifications: "/notifications",
  readState: "/notifications/read-state",
} as const;

/** Shopper ↔ vendor chat threads. */
export const CHAT_ENDPOINTS = {
  threads: "/chat/threads",
  storeThread: (storeId: string) => `/chat/threads/store/${enc(storeId)}`,
  messages: (threadId: string) => `/chat/threads/${enc(threadId)}/messages`,
} as const;

/**
 * The seller centre. Two cautions, both learned the hard way and invisible from the types:
 *
 * - `product` is a **whole-record write**, not a partial patch: the backend reads a
 *   present-but-empty `image_urls` as "clear the gallery", so an update must always resend it.
 *   Use `vendorService.updateProduct`, which builds the payload from the full record.
 * - There is a second price/stock API under `/vendor/inventory/*`. Avoid it: it anchors on the
 *   store's vendor id through a subquery that breaks for vendors with more than one store, can
 *   never clear `old_price`, and reports failure as `{"success": false}` under HTTP 200. The
 *   `/vendor/products/*` routes below are the mainline ones.
 */
export const VENDOR_ENDPOINTS = {
  applications: "/vendor/applications",
  myApplication: "/vendor/applications/me",
  store: "/vendor/store",
  /** Headline business counters in one call — order counts by status, stock health, balances. */
  dashboard: "/vendor/dashboard",
  /** `period` is validated server-side and must be exactly "7d", "30d" or "90d". */
  analytics: (period: string) => `/vendor/analytics?period=${enc(period)}`,
  customers: "/vendor/customers",
  products: "/vendor/products",
  product: (productId: string) => `/vendor/products/${enc(productId)}`,
  productStatus: (productId: string) => `/vendor/products/${enc(productId)}/status`,
  productStock: (productId: string) => `/vendor/products/${enc(productId)}/stock`,
  orders: "/vendor/orders",
  order: (orderId: string) => `/vendor/orders/${enc(orderId)}`,
  orderStatus: (orderId: string) => `/vendor/orders/${enc(orderId)}/status`,
  orderAcknowledge: (orderId: string) => `/vendor/orders/${enc(orderId)}/acknowledge`,
  orderDispatchPhoto: (orderId: string) => `/vendor/orders/${enc(orderId)}/dispatch-photo`,
  orderNotifyDeparture: (orderId: string) => `/vendor/orders/${enc(orderId)}/notify-departure`,
  /** Opt-in per order: asks ODOS to deliver with one of its own riders. */
  orderRequestCourier: (orderId: string) => `/vendor/orders/${enc(orderId)}/request-courier`,
  // Stock lives under /vendor/products/*, never /vendor/inventory/* — that
  // second API anchors ownership on Store.vendor_id, breaks with multiple
  // stores, and reports failure as {"success": false} under HTTP 200.
  productsPerformance: (days: number) => `/vendor/products/performance?days=${days}`,
  inventoryMovements: (limit: number) => `/vendor/inventory-movements?limit=${limit}`,
  returns: "/vendor/returns",
  return: (returnId: string) => `/vendor/returns/${enc(returnId)}`,
  reviews: "/vendor/reviews",
  reviewReply: (reviewId: string) => `/vendor/reviews/${enc(reviewId)}/reply`,
  vouchers: "/vendor/vouchers",
  voucher: (voucherId: string) => `/vendor/vouchers/${enc(voucherId)}`,
  voucherGift: (voucherId: string) => `/vendor/vouchers/${enc(voucherId)}/gift`,
  wallet: "/vendor/wallet",
  walletInstitutions: (methodType: string) =>
    `/vendor/wallet/payout-institutions?payout_method_type=${encodeURIComponent(methodType)}`,
  walletPayoutDetails: "/vendor/wallet/payout-details",
  walletWithdrawals: "/vendor/wallet/withdrawals",
  productsBulk: "/vendor/products/bulk",
  productMovements: (productId: string, limit: number) =>
    `/vendor/products/${enc(productId)}/inventory-movements?limit=${limit}`,
  voucherRedemptions: (voucherId: string) => `/vendor/vouchers/${enc(voucherId)}/redemptions`,
  deliverySettings: "/vendor/delivery-settings",
  storeSections: "/vendor/store/sections",
  storeSection: (sectionId: string) => `/vendor/store/sections/${enc(sectionId)}`,
  storeSectionSuggestions: "/vendor/store/sections/starter-suggestions",
  storeSectionsReorder: "/vendor/store/sections/reorder",
  storeSectionProducts: (sectionId: string) => `/vendor/store/sections/${enc(sectionId)}/products`,
  flashSaleNominations: "/vendor/flash-sale-nominations",
  openMerchandisingCampaigns: "/vendor/merchandising-campaigns/open",
  merchandisingOptIns: "/vendor/merchandising-campaign-opt-ins",
  campaigns: "/vendor/campaigns",
  campaign: (campaignId: string) => `/vendor/campaigns/${enc(campaignId)}`,
  promoOverview: "/vendor/analytics/promotions/overview",
  promoTimeseries: "/vendor/analytics/promotions/timeseries",
  promoLeaderboard: "/vendor/analytics/promotions/leaderboard",
  voucherAnalytics: "/vendor/analytics/vouchers",
  campaignAnalytics: "/vendor/analytics/campaigns",
} as const;
