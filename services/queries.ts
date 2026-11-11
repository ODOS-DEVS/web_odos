import { queryOptions } from "@tanstack/react-query";
import { accountService } from "./account.service";
import { authService } from "./auth.service";
import {
  catalogService,
  type ProductListParams,
  type StoreListParams,
} from "./catalog.service";
import { chatService } from "./chat.service";
import { deliveryService, type DeliveryQuoteInput } from "./delivery.service";
import { loyaltyService } from "./loyalty.service";
import { notificationsService } from "./notifications.service";
import { ordersService } from "./orders.service";
import { paymentsService } from "./payments.service";
import { reviewsService } from "./reviews.service";
import { vendorService } from "./vendor.service";
import { vouchersService } from "./vouchers.service";
import { walletService } from "./wallet.service";
import { wishlistService } from "./wishlist.service";

const MINUTE = 60_000;

/** Every cache key in one place, so invalidation never depends on a stray string. */
export const queryKeys = {
  categories: ["catalog", "categories"] as const,
  markets: ["catalog", "markets"] as const,
  promoBanners: ["catalog", "promo-banners"] as const,
  campaigns: ["catalog", "campaigns"] as const,
  campaign: (slug: string) => ["catalog", "campaign", slug] as const,
  stores: (params: StoreListParams = {}) =>
    ["catalog", "stores", params] as const,
  storeSections: (storeId: string) =>
    ["catalog", "store-sections", storeId] as const,
  products: (params: ProductListParams = {}) =>
    ["catalog", "products", params] as const,
  product: (id: string) => ["catalog", "product", id] as const,
  productSearch: (query: string) => ["catalog", "search", query] as const,
  deals: ["catalog", "deals"] as const,
  reviews: (productId: string) => ["reviews", productId] as const,
  myReviews: ["reviews", "me"] as const,
  deliveryQuote: (input: DeliveryQuoteInput) =>
    ["delivery", "quote", input] as const,
  storeVouchers: (storeId: string) => ["vouchers", "store", storeId] as const,
  promotions: ["vouchers", "promotions"] as const,
  myVouchers: ["vouchers", "me"] as const,
  addresses: ["account", "addresses"] as const,
  paymentMethods: ["account", "payment-methods"] as const,
  myVendorApplication: ["vendor", "application", "me"] as const,
  vendorStore: ["vendor", "store"] as const,
  vendorProducts: ["vendor", "products"] as const,
  vendorOrders: ["vendor", "orders"] as const,
  vendorCustomers: ["vendor", "customers"] as const,
  vendorAnalytics: ["vendor", "analytics"] as const,
  vendorReturns: ["vendor", "returns"] as const,
  vendorReviews: ["vendor", "reviews"] as const,
  vendorVouchers: ["vendor", "vouchers"] as const,
  vendorWallet: ["vendor", "wallet"] as const,
  vendorPayoutInstitutions: (methodType: string) => ["vendor", "payout-institutions", methodType] as const,
  vendorPerformance: (days: number) => ["vendor", "performance", days] as const,
  vendorMovements: ["vendor", "movements"] as const,
  notifications: ["notifications"] as const,
  wallet: ["wallet"] as const,
  loyalty: ["loyalty", "account"] as const,
  loyaltyHistory: ["loyalty", "history"] as const,
  wishlist: ["wishlist"] as const,
  chatThreads: ["chat", "threads"] as const,
  chatStoreThread: (storeId: string) => ["chat", "store-thread", storeId] as const,
  chatMessages: (threadId: string) => ["chat", "messages", threadId] as const,
  me: ["auth", "me"] as const,
  verifiedPhones: ["auth", "verified-phones"] as const,
  orders: ["orders"] as const,
  paymentVerification: (reference: string) => ["payments", "verify", reference] as const,
  walletTopUpVerification: (reference: string) => ["wallet", "topup-verify", reference] as const,
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
  campaigns: () =>
    queryOptions({
      queryKey: queryKeys.campaigns,
      queryFn: () => catalogService.campaigns(),
      staleTime: 10 * MINUTE,
    }),
  campaign: (slug: string) =>
    queryOptions({
      queryKey: queryKeys.campaign(slug),
      queryFn: () => catalogService.campaign(slug),
      staleTime: 5 * MINUTE,
    }),
  promoBanners: () =>
    queryOptions({
      queryKey: queryKeys.promoBanners,
      queryFn: () => catalogService.promoBanners(),
      staleTime: 10 * MINUTE,
    }),
  markets: () =>
    queryOptions({
      queryKey: queryKeys.markets,
      queryFn: () => catalogService.markets(),
      staleTime: 10 * MINUTE,
    }),
  stores: (params: StoreListParams = {}) =>
    queryOptions({
      queryKey: queryKeys.stores(params),
      queryFn: () => catalogService.stores(params),
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
  search: (query: string) =>
    queryOptions({
      queryKey: queryKeys.productSearch(query),
      queryFn: () => catalogService.search(query),
      staleTime: MINUTE,
    }),
  product: (id: string) =>
    queryOptions({
      queryKey: queryKeys.product(id),
      queryFn: () => catalogService.product(id),
      staleTime: MINUTE,
    }),
  deals: () =>
    queryOptions({
      queryKey: queryKeys.deals,
      queryFn: () => catalogService.dealProducts({ limit: 12 }),
      staleTime: MINUTE,
    }),
};

export const reviewQueries = {
  mine: () =>
    queryOptions({
      queryKey: queryKeys.myReviews,
      queryFn: () => reviewsService.mine(),
      staleTime: 30_000,
    }),
  forProduct: (productId: string) =>
    queryOptions({
      queryKey: queryKeys.reviews(productId),
      queryFn: () => reviewsService.forProduct(productId),
      staleTime: 2 * MINUTE,
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

export const voucherQueries = {
  forStore: (storeId: string) =>
    queryOptions({
      queryKey: queryKeys.storeVouchers(storeId),
      queryFn: () => vouchersService.forStore(storeId),
      staleTime: 5 * MINUTE,
    }),
  promotions: () =>
    queryOptions({
      queryKey: queryKeys.promotions,
      queryFn: () => vouchersService.promotions(),
      staleTime: 5 * MINUTE,
    }),
  mine: () =>
    queryOptions({
      queryKey: queryKeys.myVouchers,
      queryFn: () => vouchersService.mine(),
      staleTime: 30_000,
    }),
};

export const accountQueries = {
  paymentMethods: () =>
    queryOptions({
      queryKey: queryKeys.paymentMethods,
      queryFn: () => accountService.paymentMethods(),
      staleTime: 60_000,
    }),
  addresses: () =>
    queryOptions({
      queryKey: queryKeys.addresses,
      queryFn: () => accountService.addresses(),
      staleTime: 60_000,
    }),
};

export const chatQueries = {
  threads: () =>
    queryOptions({
      queryKey: queryKeys.chatThreads,
      queryFn: () => chatService.threads(),
      staleTime: 15_000,
    }),
  storeThread: (storeId: string) =>
    queryOptions({
      queryKey: queryKeys.chatStoreThread(storeId),
      queryFn: () => chatService.ensureStoreThread(storeId),
      // The thread id does not change once it exists, so there is nothing to go stale.
      staleTime: Infinity,
    }),
  messages: (threadId: string) =>
    queryOptions({
      queryKey: queryKeys.chatMessages(threadId),
      queryFn: () => chatService.messages(threadId),
      staleTime: 0,
    }),
};

export const wishlistQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.wishlist,
      queryFn: () => wishlistService.list(),
      staleTime: 30_000,
    }),
};

export const vendorQueries = {
  store: () =>
    queryOptions({
      queryKey: queryKeys.vendorStore,
      queryFn: () => vendorService.store(),
      staleTime: 5 * MINUTE,
    }),
  products: () =>
    queryOptions({
      queryKey: queryKeys.vendorProducts,
      queryFn: () => vendorService.products(),
      staleTime: 30_000,
    }),
  orders: () =>
    queryOptions({
      queryKey: queryKeys.vendorOrders,
      queryFn: () => vendorService.orders(),
      staleTime: 15_000,
    }),
  customers: () =>
    queryOptions({
      queryKey: queryKeys.vendorCustomers,
      queryFn: () => vendorService.customers(),
      staleTime: MINUTE,
    }),
  analytics: () =>
    queryOptions({
      queryKey: queryKeys.vendorAnalytics,
      queryFn: () => vendorService.analytics(),
      staleTime: 30_000,
    }),
  myApplication: () =>
    queryOptions({
      queryKey: queryKeys.myVendorApplication,
      queryFn: () => vendorService.myApplication(),
      staleTime: 60_000,
      // A shopper who has never applied gets a 404, which is an answer, not a failure.
      retry: false,
    }),
};

export const loyaltyQueries = {
  account: () =>
    queryOptions({
      queryKey: queryKeys.loyalty,
      queryFn: () => loyaltyService.account(),
      staleTime: 30_000,
    }),
  history: () =>
    queryOptions({
      queryKey: queryKeys.loyaltyHistory,
      queryFn: () => loyaltyService.history(),
      staleTime: 30_000,
    }),
};

export const notificationQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.notifications,
      queryFn: () => notificationsService.list(),
      staleTime: 30_000,
    }),
};

export const walletQueries = {
  detail: () =>
    queryOptions({
      queryKey: queryKeys.wallet,
      queryFn: () => walletService.get(),
      staleTime: 15_000,
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

export const paymentQueries = {
  /**
   * Asks the API whether a payment really went through. Never cached: the shopper lands here straight
   * from the provider, and a stale "unpaid" would be wrong a second later.
   */
  verify: (reference: string) =>
    queryOptions({
      queryKey: queryKeys.paymentVerification(reference),
      queryFn: () => paymentsService.verify(reference),
      staleTime: 0,
      gcTime: 0,
      retry: 2,
      // Keep asking while the payment is in flight. A mobile money charge is
      // approved on the shopper's handset seconds to minutes after they leave
      // the provider's page, so the first answer is usually "pending" -- and a
      // single look would report a successful payment as a failed one.
      refetchInterval: (query) => (query.state.data?.pending ? 4_000 : false),
      refetchIntervalInBackground: true,
    }),
};

export const walletTopUpQueries = {
  /**
   * Confirming a top-up is also what credits it, so this keeps asking until the
   * gateway has made its mind up -- see walletService.verifyTopUp.
   */
  verify: (reference: string) =>
    queryOptions({
      queryKey: queryKeys.walletTopUpVerification(reference),
      queryFn: () => walletService.verifyTopUp(reference),
      staleTime: 0,
      gcTime: 0,
      retry: 2,
      refetchInterval: (query) => (query.state.data?.pending ? 4_000 : false),
      refetchIntervalInBackground: true,
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
