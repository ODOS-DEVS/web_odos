/** "active" is live in the shop; anything else the API sends (e.g. "draft", "inactive") is hidden. */
export type VendorProductStatus = "active" | "draft" | (string & {});

/** A product in the signed-in vendor's own catalogue (UI model of `VendorProductRead`). */
export type VendorProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string | null;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  /** Stock minus units held by unpaid orders. */
  availableStock: number;
  status: VendorProductStatus;
  updatedAt: string;
};

/** What the add/edit form submits. Prices are whole cedis, as the API stores them. */
export type VendorProductInput = {
  name: string;
  description: string;
  category: string;
  categorySlug: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  status: VendorProductStatus;
  /** A new photo to upload; omitted keeps the current one. */
  photo?: File | null;
};

// ==========================================
// Full Vendor API Endpoints Schema Types
// ==========================================

export type VendorStatus = "pending" | "approved" | "rejected" | "under_review" | "suspended" | string;

export type VendorApplicationRead = {
  id: string;
  user_id: string;
  status: VendorStatus;
  business_name: string;
  business_category: string;
  business_description: string;
  phone_number: string;
  store_name: string;
  store_description: string;
  region: string;
  city: string;
  location_input?: string | null;
  preferred_market?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorApplicationCreate = {
  business_name: string;
  business_category: string;
  business_description: string;
  phone_number: string;
  store_name: string;
  store_description: string;
  region: string;
  city: string;
  location_input?: string;
  preferred_market?: string;
  logo_url?: string | null;
  banner_url?: string | null;
};

export type VendorProfileRead = {
  id: string;
  user_id: string;
  status: VendorStatus;
  business_name: string;
  business_category: string;
  business_description: string;
  phone_number: string;
  whatsapp_number?: string | null;
  store_id?: string | null;
  store_name?: string | null;
  rejection_reason?: string | null;
  created_at: string;
};

export type VendorDashboardRead = {
  store_name: string;
  vendor_status: VendorStatus;
  total_products: number;
  active_products: number;
  pending_orders: number;
  processing_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_sales: number;
  today_sales: number;
  today_orders: number;
  low_stock_count: number;
  out_of_stock_count: number;
  avg_rating?: number | null;
  review_count: number;
  customer_count: number;
};

export type VendorAnalyticsRead = {
  period?: string;
  sales_total: number;
  orders_total: number;
  average_order_value: number;
  conversion_rate?: number;
  top_selling_products?: {
    id: string;
    title: string;
    units_sold: number;
    revenue: number;
  }[];
  revenue_trend?: {
    date: string;
    revenue: number;
    orders: number;
  }[];
};

export type VendorCustomerRead = {
  customer_key: string;
  customer_name: string;
  customer_phone?: string | null;
  order_count: number;
  total_spent: number;
  last_order_at?: string | null;
  currency: string;
};

export type VendorReviewRead = {
  id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string | null;
  rating: number;
  comment: string;
  customer_name?: string | null;
  is_hidden: boolean;
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
  created_at: string;
};

export type VendorReturnRequestRead = {
  id: string;
  order_id: string;
  order_number: string;
  order_item_id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string | null;
  customer_name?: string | null;
  request_type: string;
  status: string;
  quantity: number;
  reason: string;
  details?: string | null;
  evidence_image_urls?: string[] | null;
  admin_note?: string | null;
  refund_amount?: number | null;
  created_at: string;
};

export type VendorWalletRead = {
  id: string;
  vendor_user_id: string;
  currency: string;
  available_balance: number;
  pending_withdrawal_balance: number;
  lifetime_earnings: number;
  total_withdrawn: number;
  total_commission: number;
  commission_rate: number;
  payout_method_type?: string | null;
  payout_details?: {
    account_number?: string;
    account_name?: string;
    bank_code?: string;
    bank_name?: string;
    momo_network?: string;
  } | null;
};

export type VendorPayoutInstitutionRead = {
  id: string;
  name: string;
  code: string;
  type: "bank" | "mobile_money";
};

export type VendorDeliverySettingsRead = {
  economy_enabled: boolean;
  economy_fee: number;
  express_enabled: boolean;
  express_fee: number;
  same_day_enabled: boolean;
  same_day_fee: number;
  free_shipping_threshold?: number | null;
  fulfillment_speed_hours?: number;
};

export type VendorStoreRead = {
  id: string;
  store_name: string;
  slug?: string;
  description: string;
  address: string;
  city: string;
  region: string;
  logo_url?: string | null;
  banner_url?: string | null;
  status: string;
};

export type VendorStoreSectionRead = {
  id: string;
  store_id: string;
  title: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
  products?: { id: string; name: string; price: number; image_url: string | null }[];
};

export type VendorVoucherRead = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  issuer_name?: string | null;
  owner_type: string;
  availability: string;
  reward_text: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  min_subtotal: number;
  max_discount?: number | null;
  is_active?: boolean;
  expires_at?: string | null;
  created_at: string;
  usage_count?: number;
};

export type VendorInventoryStatsRead = {
  total_tracked_products: number;
  in_stock_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_inventory_units: number;
  estimated_inventory_value: number;
};

export type VendorInventoryMovementRead = {
  id: string;
  product_id: string;
  product_title?: string;
  quantity_change: number;
  quantity_after: number;
  reason: string;
  reference?: string | null;
  created_at: string;
};
