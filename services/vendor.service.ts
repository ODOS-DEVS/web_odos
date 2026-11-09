import { VENDOR_ENDPOINTS } from "@/libs/api-endpoint";
import { normaliseStatus } from "./mappers";
import type {
  SellerProfile,
  SellerStats,
  VendorCustomer,
  VendorOrder,
  VendorProduct,
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
};

type VendorOrderRead = {
  id: string;
  order_number: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_region?: string | null;
  payment_label?: string | null;
  total_amount: number;
  delivery_fee?: number;
  net_amount?: number | null;
  is_settled?: boolean;
  status: string;
  delivery_status?: string;
  delivery_problem_reason?: string | null;
  placed_at?: string | null;
  created_at: string;
  items: VendorOrderItemRead[];
};

type VendorAnalyticsRead = {
  today_sales: number;
  week_sales: number;
  today_orders: number;
  week_orders: number;
  open_returns: number;
  top_products: { product_id: string; name: string; units_sold: number; revenue: number }[];
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
    status: p.status === "draft" ? "draft" : "active",
    updatedAt: p.updated_at,
  };
}

function toVendorOrder(o: VendorOrderRead): VendorOrder {
  return {
    id: o.id,
    number: o.order_number,
    placedAt: o.placed_at ?? o.created_at,
    buyerName: o.customer_name ?? "Customer",
    buyerPhone: o.customer_phone ?? null,
    address: { street: o.address_street ?? null, city: o.address_city ?? null, region: o.address_region ?? null },
    status: normaliseStatus(o.delivery_status, o.status) ?? "pending",
    rawStatus: o.status,
    paymentLabel: o.payment_label ?? null,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      name: i.title,
      imageUrl: i.image_url ?? null,
      quantity: i.quantity,
      unitPrice: i.unit_price,
    })),
    deliveryFee: o.delivery_fee ?? 0,
    total: o.total_amount,
    netAmount: o.net_amount ?? null,
    isSettled: Boolean(o.is_settled),
    deliveryProblem: o.delivery_problem_reason ?? null,
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
  logo?: File | null;
  banner?: File | null;
  shopPhoto?: File | null;
};

export type VendorApplication = {
  id: string;
  status: string;
  businessName: string;
  storeName: string;
  reviewNote: string | null;
  createdAt: string;
};

type VendorApplicationRead = {
  id: string;
  status: string;
  business_name: string;
  store_name: string;
  review_note?: string | null;
  created_at: string;
};

/* ---------- Product writes ---------- */

/**
 * A full product record as the update endpoint wants it. Built from the existing product so that
 * nothing is dropped — see the warning on `VENDOR_ENDPOINTS`.
 */
export type VendorProductUpdate = {
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  name?: string;
  status?: VendorProductStatus;
};

export type VendorProductCreate = {
  name: string;
  description: string;
  category: string;
  /** Whole cedis. */
  price: number;
  compareAtPrice?: number | null;
  stock: number;
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
          reviewNote: row.review_note ?? null,
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

  /** Headline numbers. The "awaiting" counts are not in this payload — the hook derives them. */
  async analytics() {
    const a = await apiFetch<VendorAnalyticsRead>(VENDOR_ENDPOINTS.analytics, { revalidate: false });
    return {
      todaySales: a.today_sales,
      todayOrders: a.today_orders,
      weekSales: a.week_sales,
      weekOrders: a.week_orders,
      openReturns: a.open_returns,
      topProducts: (a.top_products ?? []).map((t) => ({
        productId: t.product_id,
        name: t.name,
        unitsSold: t.units_sold,
        revenue: t.revenue,
      })),
    } satisfies Omit<SellerStats, "storeName" | "awaitingConfirmation" | "awaitingShipment" | "fulfilledPercent">;
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
    form.append("status", next.status);

    return apiFetch<unknown>(VENDOR_ENDPOINTS.product(product.id), { method: "PATCH", body: form, revalidate: false });
  },

  /** Narrow, JSON endpoints — safe to call on their own, unlike the whole-record update above. */
  setProductStock: (productId: string, stock: number) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.productStock(productId), { method: "PATCH", body: { stock } }),

  setProductStatus: (productId: string, status: VendorProductStatus) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.productStatus(productId), { method: "PATCH", body: { status } }),

  deleteProduct: (productId: string) => apiFetch<unknown>(VENDOR_ENDPOINTS.product(productId), { method: "DELETE" }),

  setOrderStatus: (orderId: string, status: string) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.orderStatus(orderId), { method: "PATCH", body: { status } }),

  acknowledgeOrder: (orderId: string) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.orderAcknowledge(orderId), { method: "POST" }),
};
