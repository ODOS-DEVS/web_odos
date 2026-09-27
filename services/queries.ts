import { queryOptions } from "@tanstack/react-query";
import { authService } from "./auth.service";
import { catalogService, type ProductListParams, type StoreListParams } from "./catalog.service";
import { deliveryService, type DeliveryQuoteInput } from "./delivery.service";
import { ordersService } from "./orders.service";
import { reviewsService } from "./reviews.service";

const MINUTE = 60_000;

/** Every cache key in one place, so invalidation never depends on a stray string. */
export const queryKeys = {
  categories: ["catalog", "categories"] as const,
  stores: (params: StoreListParams = {}) => ["catalog", "stores", params] as const,
  storeSections: (storeId: string) => ["catalog", "store-sections", storeId] as const,
  products: (params: ProductListParams = {}) => ["catalog", "products", params] as const,
  product: (id: string) => ["catalog", "product", id] as const,
  deals: ["catalog", "deals"] as const,
  reviews: (productId: string) => ["reviews", productId] as const,
  deliveryQuote: (input: DeliveryQuoteInput) => ["delivery", "quote", input] as const,
  me: ["auth", "me"] as const,
  orders: ["orders"] as const,
  order: (id: string) => ["orders", id] as const,
};

/**
 * Query option factories. The same objects power the client hooks (`hooks/`) and the server-side
 * `prefetchQuery` calls in pages, so what the server prefetched is exactly what the hook reads.
 */
export const catalogQueries = {
  categories: () => queryOptions({ queryKey: queryKeys.categories, queryFn: () => catalogService.categories(), staleTime: 10 * MINUTE }),
  stores: (params: StoreListParams = {}) =>
    queryOptions({ queryKey: queryKeys.stores(params), queryFn: () => catalogService.stores(params), staleTime: 5 * MINUTE }),
  storeSections: (storeId: string) =>
    queryOptions({ queryKey: queryKeys.storeSections(storeId), queryFn: () => catalogService.storeSections(storeId), staleTime: 5 * MINUTE }),
  products: (params: ProductListParams = {}) =>
    queryOptions({ queryKey: queryKeys.products(params), queryFn: () => catalogService.products(params), staleTime: MINUTE }),
  product: (id: string) => queryOptions({ queryKey: queryKeys.product(id), queryFn: () => catalogService.product(id), staleTime: MINUTE }),
  deals: () => queryOptions({ queryKey: queryKeys.deals, queryFn: () => catalogService.dealProducts({ limit: 12 }), staleTime: MINUTE }),
};

export const reviewQueries = {
  forProduct: (productId: string) =>
    queryOptions({ queryKey: queryKeys.reviews(productId), queryFn: () => reviewsService.forProduct(productId), staleTime: 2 * MINUTE }),
};

export const deliveryQueries = {
  quote: (input: DeliveryQuoteInput) =>
    queryOptions({ queryKey: queryKeys.deliveryQuote(input), queryFn: () => deliveryService.quote(input), staleTime: 30_000 }),
};

export const authQueries = {
  me: () => queryOptions({ queryKey: queryKeys.me, queryFn: () => authService.me(), staleTime: 5 * MINUTE }),
};

export const orderQueries = {
  list: () => queryOptions({ queryKey: queryKeys.orders, queryFn: () => ordersService.list(), staleTime: 30_000 }),
  detail: (id: string) => queryOptions({ queryKey: queryKeys.order(id), queryFn: () => ordersService.get(id), staleTime: 15_000 }),
};
