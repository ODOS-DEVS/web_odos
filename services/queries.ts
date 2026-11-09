import { queryOptions } from "@tanstack/react-query";
import { authService } from "./auth.service";
import {
  catalogService,
  type ProductListParams,
  type StoreListParams,
} from "./catalog.service";
import { deliveryService, type DeliveryQuoteInput } from "./delivery.service";
import { ordersService } from "./orders.service";
import { reviewsService } from "./reviews.service";
import { vouchersService } from "./vouchers.service";
import { paymentMethodsService } from "./payment-methods.service";
import { walletService } from "./wallet.service";
import { addressesService } from "./addresses.service";
import { loyaltyService } from "./loyalty.service";
import { accountSecurityService } from "./account-security.service";

const MINUTE = 60_000;

/** Every cache key in one place, so invalidation never depends on a stray string. */
export const queryKeys = {
  categories: ["catalog", "categories"] as const,
  markets: ["catalog", "markets"] as const,
  promoBanners: ["catalog", "promo-banners"] as const,
  campaigns: ["catalog", "campaigns"] as const,
  stores: (params: StoreListParams = {}) =>
    ["catalog", "stores", params] as const,
  store: (storeId: string) => ["catalog", "store", storeId] as const,
  storeSections: (storeId: string) =>
    ["catalog", "store-sections", storeId] as const,
  products: (params: ProductListParams = {}) =>
    ["catalog", "products", params] as const,
  flashSaleEvents: ["catalog", "flash-sales"] as const,
  flashSaleProducts: (slug: string) => ["catalog", "flash-sales", slug, "products"] as const,
  product: (id: string) => ["catalog", "product", id] as const,
  deals: ["catalog", "deals"] as const,
  campaignProducts: (campaign: string) => ["catalog", "deals", "campaign", campaign] as const,
  search: (q: string) => ["catalog", "search", q] as const,
  similar: (productId: string) => ["catalog", "similar", productId] as const,
  reviews: (productId: string) => ["reviews", productId] as const,
  myReviews: ["reviews", "mine"] as const,
  myVouchers: ["vouchers", "mine"] as const,
  wallet: ["wallet", "customer"] as const,
  paymentMethods: ["account", "payment-methods"] as const,
  addresses: ["account", "addresses"] as const,
  emailPreferences: ["account", "email-preferences"] as const,
  deletionEligibility: ["account", "deletion-eligibility"] as const,
  loyaltyAccount: ["loyalty", "account"] as const,
  loyaltyHistory: ["loyalty", "history"] as const,
  /** `viewer` keeps signed-in and guest copies apart, since `claimed` depends on who is asking. */
  storeVouchers: (storeId: string, viewer: string | null = null) => ["vouchers", "store", storeId, viewer] as const,
  promotions: (viewer: string | null = null) => ["vouchers", "promotions", viewer] as const,
  chatThreads: ["chat", "threads"] as const,
  chatStoreThread: (storeId: string, productId?: string) => ["chat", "store-thread", storeId, productId ?? null] as const,
  chatMessages: (threadId: string) => ["chat", "messages", threadId] as const,
  deliveryQuote: (input: DeliveryQuoteInput) =>
    ["delivery", "quote", input] as const,
  me: ["auth", "me"] as const,
  orders: ["orders"] as const,
  order: (id: string) => ["orders", id] as const,
};

/**
 * Query option factories. The same objects power the client hooks (`hooks/`) and the server-side
 * `prefetchQuery` calls in pages, so what the server prefetched is exactly what the hook reads.
 */
export const catalogQueries = {
  categories: () =>
    queryOptions({
      queryKey: queryKeys.categories,
      queryFn: () => catalogService.categories(),
      staleTime: 10 * MINUTE,
    }),
  markets: () =>
    queryOptions({
      queryKey: queryKeys.markets,
      queryFn: () => catalogService.markets(),
      staleTime: 10 * MINUTE,
    }),
  promoBanners: () =>
    queryOptions({
      queryKey: queryKeys.promoBanners,
      queryFn: () => catalogService.promoBanners(),
      staleTime: 5 * MINUTE,
    }),
  campaigns: () =>
    queryOptions({
      queryKey: queryKeys.campaigns,
      queryFn: () => catalogService.campaigns(),
      staleTime: 5 * MINUTE,
    }),
  stores: (params: StoreListParams = {}) =>
    queryOptions({
      queryKey: queryKeys.stores(params),
      queryFn: () => catalogService.stores(params),
      staleTime: 5 * MINUTE,
    }),
  /** One store by id (the API's detail record; URLs use the slug, resolved from `stores()` first). */
  store: (storeId: string) =>
    queryOptions({
      queryKey: queryKeys.store(storeId),
      queryFn: () => catalogService.store(storeId),
      staleTime: 5 * MINUTE,
    }),
  storeSections: (storeId: string) =>
    queryOptions({
      queryKey: queryKeys.storeSections(storeId),
      queryFn: () => catalogService.storeSections(storeId),
      staleTime: 5 * MINUTE,
    }),
  products: (params: ProductListParams = {}) =>
    queryOptions({
      queryKey: queryKeys.products(params),
      queryFn: () => catalogService.products(params),
      staleTime: MINUTE,
    }),
  product: (id: string) =>
    queryOptions({
      queryKey: queryKeys.product(id),
      queryFn: () => catalogService.product(id),
      staleTime: MINUTE,
    }),
  flashSaleEvents: () =>
    queryOptions({
      queryKey: queryKeys.flashSaleEvents,
      queryFn: () => catalogService.flashSaleEvents(),
      staleTime: 30_000,
    }),
  flashSaleProducts: (slug: string) =>
    queryOptions({
      queryKey: queryKeys.flashSaleProducts(slug),
      queryFn: () => catalogService.flashSaleProducts(slug),
      staleTime: 30_000,
    }),
  deals: () =>
    queryOptions({
      queryKey: queryKeys.deals,
      queryFn: () => catalogService.dealProducts({ limit: 12 }),
      staleTime: MINUTE,
    }),
  /** Products in one merchandising campaign (`campaign_tag` on deal products). */
  campaignProducts: (campaign: string) =>
    queryOptions({
      queryKey: queryKeys.campaignProducts(campaign),
      queryFn: () => catalogService.dealProducts({ campaign_tag: campaign, limit: 100 }),
      staleTime: MINUTE,
    }),
  search: (q: string) =>
    queryOptions({
      queryKey: queryKeys.search(q),
      queryFn: () => catalogService.search(q),
      staleTime: MINUTE,
    }),
  similar: (productId: string) =>
    queryOptions({
      queryKey: queryKeys.similar(productId),
      queryFn: () => catalogService.similar(productId),
      staleTime: 5 * MINUTE,
    }),
};

export const reviewQueries = {
  forProduct: (productId: string) =>
    queryOptions({
      queryKey: queryKeys.reviews(productId),
      queryFn: () => reviewsService.forProduct(productId),
      staleTime: 2 * MINUTE,
    }),
  mine: () =>
    queryOptions({
      queryKey: queryKeys.myReviews,
      queryFn: () => reviewsService.mine(),
      staleTime: MINUTE,
    }),
};

export const voucherQueries = {
  /** `viewer` keeps signed-in and guest copies apart (`claimed` depends on who asks). */
  promotions: (viewer: string | null = null) =>
    queryOptions({
      queryKey: queryKeys.promotions(viewer),
      queryFn: () => vouchersService.promotions(),
      staleTime: MINUTE,
    }),
  forStore: (storeId: string, viewer: string | null = null) =>
    queryOptions({
      queryKey: queryKeys.storeVouchers(storeId, viewer),
      queryFn: () => vouchersService.forStore(storeId),
      staleTime: MINUTE,
    }),
  mine: () =>
    queryOptions({
      queryKey: queryKeys.myVouchers,
      queryFn: () => vouchersService.mine(),
      staleTime: MINUTE,
    }),
};

export const walletQueries = {
  customer: () =>
    queryOptions({
      queryKey: queryKeys.wallet,
      queryFn: () => walletService.get(),
      staleTime: 30_000,
    }),
};

export const accountQueries = {
  paymentMethods: () =>
    queryOptions({
      queryKey: queryKeys.paymentMethods,
      queryFn: () => paymentMethodsService.list(),
      staleTime: MINUTE,
    }),
  addresses: () =>
    queryOptions({
      queryKey: queryKeys.addresses,
      queryFn: () => addressesService.list(),
      staleTime: MINUTE,
    }),
  emailPreferences: () =>
    queryOptions({
      queryKey: queryKeys.emailPreferences,
      queryFn: () => accountSecurityService.getEmailPreferences(),
      staleTime: 5 * MINUTE,
    }),
  deletionEligibility: () =>
    queryOptions({
      queryKey: queryKeys.deletionEligibility,
      queryFn: () => accountSecurityService.checkDeletionEligibility(),
      staleTime: 0,
    }),
};

export const loyaltyQueries = {
  account: () =>
    queryOptions({
      queryKey: queryKeys.loyaltyAccount,
      queryFn: () => loyaltyService.account(),
      staleTime: MINUTE,
    }),
  history: () =>
    queryOptions({
      queryKey: queryKeys.loyaltyHistory,
      queryFn: () => loyaltyService.history(),
      staleTime: MINUTE,
    }),
};

export const deliveryQueries = {
  quote: (input: DeliveryQuoteInput) =>
    queryOptions({
      queryKey: queryKeys.deliveryQuote(input),
      queryFn: () => deliveryService.quote(input),
      staleTime: 30_000,
    }),
};

export const authQueries = {
  me: () =>
    queryOptions({
      queryKey: queryKeys.me,
      queryFn: () => authService.me(),
      staleTime: 5 * MINUTE,
    }),
};

export const orderQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.orders,
      queryFn: () => ordersService.list(),
      staleTime: 30_000,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.order(id),
      queryFn: () => ordersService.get(id),
      staleTime: 15_000,
    }),
};
