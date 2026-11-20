import { VENDOR_ENDPOINTS } from "@/libs/api-endpoint";
import { toVendorOrderStatus, toVendorProductStatus } from "@/libs/vendor-orders";

const humaniseStatus = (status: string) =>
  status.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
import type {
  SellerProfile,
  VendorAnalytics,
  VendorAnalyticsPeriod,
  VendorDashboard,
  VendorCustomer,
  VendorOrder,
  VendorProduct,
  VendorOrderStatus,
  VendorProductSelfServiceStatus,
  VendorProductStatus,
} from "@/types/vendor";
import { apiFetch } from "./http";

/* ---------- Wire shapes ---------- */

type VendorProductRead = {
  id: string;
  name: string;
  description: string;
  category: string;
  category_slug?: string | null;
  subcategory?: string | null;
  price: number;
  old_price?: number | null;
  stock: number;
  available_stock?: number;
  image_key: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  placement_tags?: string[] | null;
  color_options?: string[] | null;
  size_options?: string[] | null;
  specifications?: string[] | null;
  is_returnable: boolean;
  is_negotiable?: boolean;
  min_acceptable_price?: number | null;
  negotiation_max_quantity?: number | null;
  negotiation_note?: string | null;
  status: string;
  updated_at: string;
};

type VendorOrderItemRead = {
  id: string;
  product_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  image_url?: string | null;
  selected_size?: string | null;
  selected_color?: string | null;
};

/** Verified against a live payload: the timestamp is `occurred_at`, and there is no label. */
type OrderStatusEventRead = {
  id: string;
  status: string;
  actor_role?: string | null;
  note?: string | null;
  occurred_at: string;
};

type VendorOrderRead = {
  id: string;
  order_number: string;
  package_id?: string | null;
  package_number?: number;
  package_count?: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_method?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_region?: string | null;
  payment_label?: string | null;
  product_count?: number;
  total_amount: number;
  delivery_fee?: number;
  gross_amount?: number | null;
  commission_amount?: number | null;
  net_amount?: number | null;
  currency?: string;
  is_settled?: boolean;
  /** This vendor's package status: one of the seven canonical vendor statuses. */
  status: string;
  delivery_status?: string;
  delivery_problem_reason?: string | null;
  delivery_instructions?: string | null;
  reschedule_requested_at?: string | null;
  reschedule_note?: string | null;
  dispatch_photo_url?: string | null;
  departure_notified_at?: string | null;
  placed_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  items: VendorOrderItemRead[];
  timeline?: OrderStatusEventRead[];
};

type VendorAnalyticsRead = {
  currency?: string;
  period?: string;
  today_sales: number;
  week_sales: number;
  today_orders: number;
  week_orders: number;
  period_sales?: number;
  period_orders?: number;
  open_returns: number;
  top_products: {
    product_id: string;
    product_title: string;
    product_image_url?: string | null;
    units_sold: number;
    gross_sales: number;
  }[];
  /** One point per day across the window, already zero-filled by the API. */
  daily_points?: { date: string; sales: number; orders: number }[];
};

type VendorDashboardRead = {
  store_name: string;
  vendor_status: string;
  total_products: number;
  active_products: number;
  pending_orders: number;
  processing_orders?: number;
  completed_orders: number;
  cancelled_orders?: number;
  total_sales: number;
  today_sales?: number;
  today_orders?: number;
  low_stock_count?: number;
  out_of_stock_count?: number;
  avg_rating?: number | null;
  review_count?: number;
  customer_count?: number;
  currency?: string;
  available_balance?: number;
  pending_withdrawal_balance?: number;
  lifetime_earnings?: number;
  total_commission?: number;
  active_voucher_count?: number;
  is_on_vacation?: boolean;
};

type VendorStoreRead = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  phone?: string | null;
  location?: string | null;
  city: string;
  region: string;
  logo_image_url?: string | null;
  banner_image_url?: string | null;
  status: string;
  is_on_vacation?: boolean;
  whatsapp_url?: string | null;
  website_url?: string | null;
};

type VendorCustomerRead = {
  customer_key: string;
  customer_name: string;
  customer_phone?: string | null;
  order_count: number;
  total_spent: number;
  last_order_at?: string | null;
};

/* ---------- Mappers ---------- */

function toVendorProduct(p: VendorProductRead): VendorProduct {
  const gallery = p.image_urls?.filter(Boolean) ?? [];
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    categorySlug: p.category_slug ?? null,
    subcategory: p.subcategory ?? null,
    price: p.price,
    compareAtPrice: p.old_price && p.old_price > p.price ? p.old_price : null,
    stock: p.stock,
    availableStock: p.available_stock ?? p.stock,
    imageKey: p.image_key,
    imageUrl: p.image_url ?? null,
    // Fall back to the cover so an update never sends an empty gallery and wipes it.
    imageUrls: gallery.length ? gallery : p.image_url ? [p.image_url] : [],
    placementTags: p.placement_tags ?? [],
    colorOptions: p.color_options ?? [],
    sizeOptions: p.size_options ?? [],
    specifications: p.specifications ?? [],
    isReturnable: p.is_returnable,
    isNegotiable: Boolean(p.is_negotiable),
    minAcceptablePrice: p.min_acceptable_price ?? null,
    negotiationMaxQuantity: p.negotiation_max_quantity ?? null,
    negotiationNote: p.negotiation_note ?? null,
    status: toVendorProductStatus(p.status),
    updatedAt: p.updated_at,
  };
}

/**
 * `status` is taken straight off the wire and never run through `normaliseStatus`.
 *
 * That helper joins `delivery_status` into the text it matches, and its default
 * "not_dispatched" contains the substring "dispatch", so every undispatched order came back
 * as "out_for_delivery" — which both mislabelled the row and offered the vendor a "Mark
 * delivered" action the API rejects. See `libs/vendor-orders.ts`.
 */
function toVendorOrder(o: VendorOrderRead): VendorOrder {
  return {
    id: o.id,
    number: o.order_number,
    packageNumber: o.package_number ?? 1,
    packageCount: o.package_count ?? 1,
    placedAt: o.placed_at ?? o.created_at,
    paidAt: o.paid_at ?? null,
    buyerName: o.customer_name ?? "Customer",
    buyerPhone: o.customer_phone ?? null,
    address: { street: o.address_street ?? null, city: o.address_city ?? null, region: o.address_region ?? null },
    status: toVendorOrderStatus(o.status),
    deliveryStatus: o.delivery_status ?? "not_dispatched",
    deliveryMethod: o.delivery_method ?? null,
    deliveryInstructions: o.delivery_instructions ?? null,
    paymentLabel: o.payment_label ?? null,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      name: i.title,
      imageUrl: i.image_url ?? null,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      // The vendor is packing this bag — without the variant they ship the wrong one.
      size: i.selected_size ?? null,
      color: i.selected_color ?? null,
    })),
    productCount: o.product_count ?? o.items.reduce((sum, i) => sum + i.quantity, 0),
    deliveryFee: o.delivery_fee ?? 0,
    total: o.total_amount,
    grossAmount: o.gross_amount ?? null,
    commissionAmount: o.commission_amount ?? null,
    netAmount: o.net_amount ?? null,
    currency: o.currency ?? "GHS",
    isSettled: Boolean(o.is_settled),
    deliveryProblem: o.delivery_problem_reason ?? null,
    dispatchPhotoUrl: o.dispatch_photo_url ?? null,
    departureNotifiedAt: o.departure_notified_at ?? null,
    rescheduleRequestedAt: o.reschedule_requested_at ?? null,
    rescheduleNote: o.reschedule_note ?? null,
    timeline: (o.timeline ?? []).map((e) => ({
      id: e.id,
      status: e.status,
      label: humaniseStatus(e.status),
      actorRole: e.actor_role ?? null,
      note: e.note ?? null,
      occurredAt: e.occurred_at,
    })),
  };
}

function toSellerProfile(s: VendorStoreRead): SellerProfile {
  return {
    storeName: s.name,
    slug: s.slug,
    description: s.description,
    category: s.category,
    phone: s.phone ?? null,
    address: s.location ?? null,
    city: s.city,
    region: s.region,
    logoUrl: s.logo_image_url ?? null,
    bannerUrl: s.banner_image_url ?? null,
    status: s.status,
    isOnVacation: Boolean(s.is_on_vacation),
    whatsappUrl: s.whatsapp_url ?? null,
    websiteUrl: s.website_url ?? null,
  };
}

/* ---------- Vendor application ---------- */

export type VendorApplicationInput = {
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  phoneNumber: string;
  region: string;
  city: string;
  storeName: string;
  storeDescription: string;
  storeLocation: string;
  /** The market's id, not its name. */
  marketId: string | null;
  whatsappNumber?: string | null;
  /**
   * The applicant's Ghana Card number, in the printed `GHA-123456789-0` form. Returned only to
   * the applicant themselves (`/vendor/applications/me`) and to verification admins; no public or
   * catalogue schema carries it, and this client never reads it back.
   */
  ghanaCardNumber: string;
  logo?: File | null;
  banner?: File | null;
  shopPhoto?: File | null;
};

/**
 * No rejection reason is available: `VendorApplication` has a `reviewed_at` column but no
 * review-note column anywhere in the model, so there is nothing to show a rejected vendor
 * beyond the status itself. (`review_notes` exists on vouchers, flash-sale nominations and
 * campaign opt-ins — just not on applications.)
 */
export type VendorApplication = {
  id: string;
  status: string;
  businessName: string;
  storeName: string;
  createdAt: string;
};

type VendorApplicationRead = {
  id: string;
  status: string;
  business_name: string;
  store_name: string;
  created_at: string;
};

/* ---------- Product writes ---------- */

/**
 * A full product record as the update endpoint wants it. Built from the existing product so that
 * nothing is dropped — see the warning on `VENDOR_ENDPOINTS`.
 */
export type VendorProductUpdate = {
  name?: string;
  description?: string;
  category?: string;
  categorySlug?: string | null;
  subcategory?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  imageUrls?: string[];
  placementTags?: string[];
  colorOptions?: string[];
  sizeOptions?: string[];
  specifications?: string[];
  isReturnable?: boolean;
  isNegotiable?: boolean;
  /** Private floor. Sent to the API, never read back into any public surface. */
  minAcceptablePrice?: number | null;
  negotiationMaxQuantity?: number | null;
  negotiationNote?: string | null;
  status?: VendorProductStatus;
  /** Files to append to the gallery. Existing photos are kept via `imageUrls`. */
  newImages?: File[];
};

export type VendorProductCreate = {
  name: string;
  description: string;
  category: string;
  categorySlug?: string | null;
  subcategory?: string | null;
  /** Whole cedis. */
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  placementTags?: string[];
  colorOptions?: string[];
  sizeOptions?: string[];
  specifications?: string[];
  isReturnable?: boolean;
  isNegotiable?: boolean;
  /** Private floor. Sent to the API, never read back into any public surface. */
  minAcceptablePrice?: number | null;
  negotiationMaxQuantity?: number | null;
  negotiationNote?: string | null;
  images?: File[];
};

/** Array encodings the backend expects, which differ per field. */
const asList = (values: string[]) => values.join(", ");
const asLines = (values: string[]) => values.join("\n");

export const vendorService = {
  /* -- Application -- */

  async myApplication(): Promise<VendorApplication | null> {
    const row = await apiFetch<VendorApplicationRead | null>(VENDOR_ENDPOINTS.myApplication, { revalidate: false });
    return row
      ? {
          id: row.id,
          status: row.status,
          businessName: row.business_name,
          storeName: row.store_name,
          createdAt: row.created_at,
        }
      : null;
  },

  apply(input: VendorApplicationInput) {
    const form = new FormData();
    form.append("business_name", input.businessName.trim());
    form.append("business_category", input.businessCategory);
    form.append("business_description", input.businessDescription.trim());
    form.append("phone_number", input.phoneNumber.trim());
    form.append("region", input.region);
    form.append("city", input.city.trim());
    form.append("store_name", input.storeName.trim());
    form.append("store_description", input.storeDescription.trim());
    form.append("store_location", input.storeLocation.trim());
    if (input.marketId) form.append("market_id", input.marketId);
    if (input.whatsappNumber?.trim()) form.append("whatsapp_number", input.whatsappNumber.trim());
    form.append("ghana_card_number", input.ghanaCardNumber.trim());
    if (input.logo) form.append("logo_image", input.logo);
    if (input.banner) form.append("banner_image", input.banner);
    if (input.shopPhoto) form.append("shop_image", input.shopPhoto);
    return apiFetch<unknown>(VENDOR_ENDPOINTS.applications, { method: "POST", body: form, revalidate: false });
  },

  /* -- Reads -- */

  async store(): Promise<SellerProfile> {
    return toSellerProfile(await apiFetch<VendorStoreRead>(VENDOR_ENDPOINTS.store, { revalidate: false }));
  },

  async products(): Promise<VendorProduct[]> {
    const rows = await apiFetch<VendorProductRead[]>(VENDOR_ENDPOINTS.products, { revalidate: false });
    return rows.map(toVendorProduct).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  },

  async orders(): Promise<VendorOrder[]> {
    const rows = await apiFetch<VendorOrderRead[]>(VENDOR_ENDPOINTS.orders, { revalidate: false });
    return rows.map(toVendorOrder).sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt));
  },

  async customers(): Promise<VendorCustomer[]> {
    const rows = await apiFetch<VendorCustomerRead[]>(VENDOR_ENDPOINTS.customers, { revalidate: false });
    return rows.map((c) => ({
      key: c.customer_key,
      name: c.customer_name,
      phone: c.customer_phone ?? null,
      orderCount: c.order_count,
      totalSpent: c.total_spent,
      lastOrderAt: c.last_order_at ?? null,
    }));
  },

  /**
   * Sales over a window, including the per-day series the trend charts draw. The "awaiting"
   * queue counts are not in this payload — the hook derives those from the order list.
   */
  async analytics(period: VendorAnalyticsPeriod = "30d"): Promise<VendorAnalytics> {
    const a = await apiFetch<VendorAnalyticsRead>(VENDOR_ENDPOINTS.analytics(period), { revalidate: false });
    return {
      currency: a.currency ?? "GHS",
      period: (a.period as VendorAnalyticsPeriod) ?? period,
      todaySales: a.today_sales,
      todayOrders: a.today_orders,
      weekSales: a.week_sales,
      weekOrders: a.week_orders,
      periodSales: a.period_sales ?? 0,
      periodOrders: a.period_orders ?? 0,
      openReturns: a.open_returns,
      topProducts: (a.top_products ?? []).map((t) => ({
        productId: t.product_id,
        name: t.product_title,
        imageUrl: t.product_image_url ?? null,
        unitsSold: t.units_sold,
        revenue: t.gross_sales,
      })),
      dailyPoints: (a.daily_points ?? []).map((d) => ({ date: d.date, sales: d.sales, orders: d.orders })),
    };
  },

  /**
   * The counters the dashboard leads with. Everything here is computed server-side across the
   * whole catalogue and order history, so it is accurate in a way counting a page of orders
   * client-side is not.
   */
  async dashboard(): Promise<VendorDashboard> {
    const d = await apiFetch<VendorDashboardRead>(VENDOR_ENDPOINTS.dashboard, { revalidate: false });
    return {
      storeName: d.store_name,
      vendorStatus: d.vendor_status,
      totalProducts: d.total_products,
      activeProducts: d.active_products,
      pendingOrders: d.pending_orders,
      processingOrders: d.processing_orders ?? 0,
      completedOrders: d.completed_orders,
      cancelledOrders: d.cancelled_orders ?? 0,
      totalSales: d.total_sales,
      todaySales: d.today_sales ?? 0,
      todayOrders: d.today_orders ?? 0,
      lowStockCount: d.low_stock_count ?? 0,
      outOfStockCount: d.out_of_stock_count ?? 0,
      avgRating: d.avg_rating ?? null,
      reviewCount: d.review_count ?? 0,
      customerCount: d.customer_count ?? 0,
      currency: d.currency ?? "GHS",
      availableBalance: d.available_balance ?? 0,
      pendingWithdrawalBalance: d.pending_withdrawal_balance ?? 0,
      lifetimeEarnings: d.lifetime_earnings ?? 0,
      totalCommission: d.total_commission ?? 0,
      activeVoucherCount: d.active_voucher_count ?? 0,
      isOnVacation: Boolean(d.is_on_vacation),
    };
  },

  /* -- Writes -- */

  /**
   * Adds a product. `description` is required by the API even though it is easy to forget, and the
   * price is an integer — the backend parses it with a bare `int()`, which raises on "85.50".
   */
  createProduct(input: VendorProductCreate) {
    const form = new FormData();
    form.append("name", input.name.trim());
    form.append("description", input.description.trim());
    form.append("category", input.category.trim());
    form.append("price", String(Math.round(input.price)));
    form.append("stock", String(input.stock));
    if (typeof input.compareAtPrice === "number" && Number.isFinite(input.compareAtPrice)) {
      form.append("old_price", String(Math.round(input.compareAtPrice)));
    }
    if (input.categorySlug?.trim()) form.append("category_slug", input.categorySlug.trim());
    if (input.subcategory?.trim()) form.append("subcategory", input.subcategory.trim());
    if (input.placementTags?.length) form.append("placement_tags", asList(input.placementTags));
    if (input.colorOptions?.length) form.append("color_options", asList(input.colorOptions));
    if (input.sizeOptions?.length) form.append("size_options", asList(input.sizeOptions));
    if (input.specifications?.length) form.append("specifications", asLines(input.specifications));
    if (typeof input.isReturnable === "boolean") form.append("is_returnable", String(input.isReturnable));
    if (typeof input.isNegotiable === "boolean") form.append("is_negotiable", String(input.isNegotiable));
    // Only sent when negotiation is on: the API treats an absent value as "leave alone", and
    // turning negotiation off retires the floor there rather than here.
    if (input.isNegotiable) {
      if (input.minAcceptablePrice != null) form.append("min_acceptable_price", String(input.minAcceptablePrice));
      if (input.negotiationMaxQuantity != null) {
        form.append("negotiation_max_quantity", String(input.negotiationMaxQuantity));
      }
      if (input.negotiationNote != null) form.append("negotiation_note", input.negotiationNote);
    }
    for (const file of input.images ?? []) form.append("images", file);
    return apiFetch<unknown>(VENDOR_ENDPOINTS.products, { method: "POST", body: form, revalidate: false });
  },

  /**
   * Updating a product rewrites the whole record, so the payload is built from `product` with only
   * the changed fields overridden. Sending just the changed field would clear the gallery and blank
   * every other column — with a 200 response.
   *
   * Prices are integers end to end (the backend parses them with a bare `int()`, which raises on
   * "85.50"), so they are rounded here rather than failing the save.
   */
  updateProduct(product: VendorProduct, changes: VendorProductUpdate) {
    const next = { ...product, ...changes };
    const form = new FormData();

    form.append("name", next.name.trim());
    form.append("description", next.description);
    form.append("category", next.category);
    if (next.categorySlug?.trim()) form.append("category_slug", next.categorySlug.trim());
    form.append("subcategory", next.subcategory ?? "");
    form.append("price", String(Math.round(next.price)));
    form.append(
      "old_price",
      typeof next.compareAtPrice === "number" && Number.isFinite(next.compareAtPrice)
        ? String(Math.round(next.compareAtPrice))
        : "",
    );
    form.append("stock", String(next.stock));
    form.append("image_key", next.imageKey);
    form.append("image_url", next.imageUrl ?? "");
    // Newline-separated, and never empty unless the gallery really is.
    form.append("image_urls", asLines(next.imageUrls));
    form.append("placement_tags", asList(next.placementTags));
    form.append("color_options", asList(next.colorOptions));
    form.append("size_options", asList(next.sizeOptions));
    form.append("specifications", asLines(next.specifications));
    form.append("is_returnable", String(next.isReturnable));
    form.append("is_negotiable", String(next.isNegotiable ?? false));
    // Only sent while negotiation is on. Switching it off retires the floor server-side, so
    // resending a stale minimum here would fight that.
    if (next.isNegotiable) {
      if (next.minAcceptablePrice != null) form.append("min_acceptable_price", String(next.minAcceptablePrice));
      if (next.negotiationMaxQuantity != null) {
        form.append("negotiation_max_quantity", String(next.negotiationMaxQuantity));
      }
      form.append("negotiation_note", next.negotiationNote ?? "");
    }
    form.append("status", next.status);
    // Appended to the gallery by the API; `image_urls` above preserves what is already there.
    for (const file of changes.newImages ?? []) form.append("images", file);

    return apiFetch<unknown>(VENDOR_ENDPOINTS.product(product.id), { method: "PATCH", body: form, revalidate: false });
  },

  /** Narrow, JSON endpoints — safe to call on their own, unlike the whole-record update above. */
  setProductStock: (productId: string, stock: number) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.productStock(productId), { method: "PATCH", body: { stock } }),

  /** Only `active` (republish) and `hidden` are accepted; anything else is refused. */
  setProductStatus: (productId: string, status: VendorProductSelfServiceStatus) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.productStatus(productId), { method: "PATCH", body: { status } }),

  deleteProduct: (productId: string) => apiFetch<unknown>(VENDOR_ENDPOINTS.product(productId), { method: "DELETE" }),

  /**
   * Advances this vendor's package. The API accepts only exact single steps from
   * `VENDOR_ORDER_NEXT_STATUS` (plus `cancelled` from pending/confirmed) and rejects anything
   * else with a 400, so callers must derive the target from `getVendorOrderNextStatus`.
   */
  setOrderStatus: (orderId: string, status: VendorOrderStatus) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.orderStatus(orderId), { method: "PATCH", body: { status } }),

  acknowledgeOrder: (orderId: string) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.orderAcknowledge(orderId), { method: "POST" }),

  /** Proof-of-handover photo. The API stores it on the order and shows it to the customer. */
  uploadDispatchPhoto: (orderId: string, photo: File) => {
    const form = new FormData();
    form.append("photo", photo);
    return apiFetch<unknown>(VENDOR_ENDPOINTS.orderDispatchPhoto(orderId), {
      method: "POST",
      body: form,
      revalidate: false,
    });
  },

  /** Pings the customer that their delivery has left the shop. */
  notifyDeparture: (orderId: string) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.orderNotifyDeparture(orderId), { method: "POST" }),

  /** Opt-in, per order: an order the vendor never asks about keeps their own rider. */
  requestCourier: (orderId: string) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.orderRequestCourier(orderId), { method: "POST" }),

  /** Stock or status across many products at once. JSON, and narrow — no gallery risk. */
  bulkUpdateProducts: (input: { productIds: string[]; stock?: number; status?: VendorProductSelfServiceStatus }) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.productsBulk, {
      method: "PATCH",
      body: { product_ids: input.productIds, stock: input.stock, status: input.status },
    }),
};
