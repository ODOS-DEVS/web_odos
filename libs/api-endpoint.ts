
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
 * `products` accepts `limit` up to 100. `search` and `dealsHub` require a login.
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
 * Hosted checkout: `checkout` creates the order and a payment session in one call and returns the
 * `authorization_url` to redirect to; `verify` confirms the `reference` when the shopper comes back.
 * The provider webhooks (`/payments/paystack/webhook`, `/payments/ipay/ipn`) are server-to-server
 * callbacks and are deliberately not modelled here.
 */
export const PAYMENTS_ENDPOINTS = {
  checkout: "/payments/checkout",
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
