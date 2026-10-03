/**
 * Hand-written types for the backend's REST contract — no codegen, no network fetch at build time.
 * Shaped to match `appbe.odos.market`'s OpenAPI schema for the endpoints this app actually calls;
 * re-derive by hand from the API docs if a field drifts rather than wiring up `openapi-typescript`.
 */

// Users / auth

export type UserRole = "customer" | "vendor" | "admin" | "courier";
export type VendorStatus = "none" | "pending" | "under_review" | "approved" | "rejected" | "suspended";

export type UserCreate = {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string | null;
};

export type UserRead = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  city: string | null;
  region: string | null;
  allow_notifications: boolean;
  discount_notifications: boolean;
  store_notifications: boolean;
  vendor_order_notifications: boolean;
  vendor_notify_orders: boolean;
  vendor_notify_inventory: boolean;
  vendor_notify_reviews: boolean;
  vendor_notify_payouts: boolean;
  system_notifications: boolean;
  location_notifications: boolean;
  location_updates: boolean;
  personalization_enabled: boolean;
  analytics_enabled: boolean;
  role: UserRole;
  admin_permission?: string | null;
  roles: string[];
  vendor_status: VendorStatus;
  vendor_id: string | null;
  vendor_rejection_reason: string | null;
  is_active: boolean;
  is_verified: boolean;
  phone_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  /** Not yet on the backend — mock-only until the API adds them, so treat as possibly absent. */
  other_names?: string | null;
  social_sharing_enabled?: boolean;
};

export type UserUpdate = {
  full_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  city?: string | null;
  region?: string | null;
  allow_notifications?: boolean | null;
  discount_notifications?: boolean | null;
  store_notifications?: boolean | null;
  vendor_order_notifications?: boolean | null;
  vendor_notify_orders?: boolean | null;
  vendor_notify_inventory?: boolean | null;
  vendor_notify_reviews?: boolean | null;
  vendor_notify_payouts?: boolean | null;
  system_notifications?: boolean | null;
  location_notifications?: boolean | null;
  location_updates?: boolean | null;
  personalization_enabled?: boolean | null;
  analytics_enabled?: boolean | null;
  /** Not yet on the backend — mock-only until the API adds them. */
  other_names?: string | null;
  social_sharing_enabled?: boolean | null;
};

export type AuthToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserRead;
};

export type MessageResponse = {
  message: string;
};

// Catalog

export type CategoryRead = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  image_key: string;
  image_url?: string | null;
  subcategories?: string[] | null;
  sort_order: number;
};

export type MarketRead = {
  id: string;
  slug: string;
  title: string;
  image_key: string;
  image_url?: string | null;
  sort_order: number;
};

export type ProductRead = {
  id: string;
  audience_slug: string | null;
  section: string | null;
  placement_tags?: string[] | null;
  title: string;
  category: string | null;
  subcategory?: string | null;
  category_slugs?: string[] | null;
  subcategory_slugs?: string[] | null;
  price: number;
  old_price: number | null;
  discount: string | null;
  rating: number | null;
  reviews: string | null;
  image_key: string;
  image_url: string | null;
  image_urls?: string[] | null;
  color_options?: string[] | null;
  size_options?: string[] | null;
  specifications?: string[] | null;
  description: string | null;
  stock: number;
  status: string;
  store_id: string | null;
  sort_order: number;
  flash_sale_ends_at?: string | null;
  flash_sale_event_slug?: string | null;
  flash_sale_event_title?: string | null;
  flash_sale_stock_limit?: number | null;
  flash_sale_units_remaining?: number | null;
  created_at: string;
  updated_at: string;
};

export type ProductReviewRead = {
  id: string;
  product_id: string;
  rating: number;
  comment: string;
  user_display_name: string;
  created_at: string;
  updated_at: string;
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
};

export type StoreRead = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  audience_slugs?: string[] | null;
  market_id: string | null;
  market_slug: string | null;
  image_key: string;
  image_url: string | null;
  image_banner_key: string | null;
  image_banner_url: string | null;
  rating: number | null;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  twitter_url?: string | null;
  whatsapp_url?: string | null;
  website_url?: string | null;
  email: string | null;
  city: string | null;
  region: string | null;
  distance_km: string | null;
  travel_minutes: string | null;
  description: string | null;
  status: string;
  sort_order: number;
  is_on_vacation: boolean;
  vacation_message?: string | null;
  business_hours?: Record<string, unknown> | null;
  delivery_badge?: string | null;
  delivery_fee_from?: number | null;
};

export type StoreSectionRead = {
  id: string;
  title: string;
  slug: string;
  sort_order: number;
  products: ProductRead[];
};

// Orders

export type OrderItemCreate = {
  product_id: string;
  title: string;
  category?: string | null;
  image_url?: string | null;
  image_key?: string | null;
  quantity: number;
  unit_price: number;
  selected_color?: string | null;
  selected_size?: string | null;
};

export type OrderItemRead = {
  id: string;
  product_id: string;
  title: string;
  category: string | null;
  image_url: string | null;
  image_key: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_returnable: boolean;
  selected_color: string | null;
  selected_size: string | null;
  created_at: string;
};

export type OrderPackageRead = {
  id: string;
  order_id: string;
  vendor_user_id: string | null;
  store_id: string | null;
  store_name: string | null;
  package_number: number;
  vendor_status: string;
  delivery_status: string;
  items_subtotal: number;
  discount_share: number;
  delivery_fee: number;
  delivery_fee_waived: boolean;
  settlement_status: string;
  dispatched_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  confirmation_method: string | null;
  auto_release_at: string | null;
  delivery_problem_reason: string | null;
  delivery_problem_reported_at: string | null;
  reschedule_requested_at: string | null;
  reschedule_note: string | null;
  dispatch_photo_url: string | null;
  departure_notified_at: string | null;
  tracking_eta: string | null;
  created_at: string;
  updated_at: string;
  item_ids: string[];
};

export type OrderStatusEventRead = {
  id: string;
  status: string;
  actor_role: string;
  actor_id?: string | null;
  note: string | null;
  event_metadata?: Record<string, unknown> | null;
  occurred_at: string;
};

export type OrderCreate = {
  source: "buy_now" | "cart";
  items: OrderItemCreate[];
  subtotal_amount: number;
  shipping_amount: number;
  delivery_method: "economy" | "express" | "same_day";
  discount_amount: number;
  total_amount: number;
  voucher_code?: string | null;
  address_full_name: string;
  address_phone: string;
  address_street: string;
  address_city: string;
  address_region: string;
  delivery_instructions?: string | null;
  payment_type: string;
  payment_label: string;
  payment_network?: string | null;
  payment_phone?: string | null;
  payment_last4?: string | null;
};

export type OrderRead = {
  id: string;
  order_number: string;
  source: string;
  status: string;
  vendor_status: string;
  payment_status: string;
  payment_provider: string;
  payment_reference: string | null;
  subtotal_amount: number;
  shipping_amount: number;
  delivery_method: string;
  total_amount: number;
  progress: number | null;
  tracking_eta: string | null;
  cancellation_reason: string | null;
  delivery_instructions: string | null;
  delivery_rating: number | null;
  delivery_rated_at: string | null;
  delivery_status: string;
  dispatched_at: string | null;
  confirmation_method: string | null;
  delivery_problem_reason: string | null;
  delivery_problem_reported_at: string | null;
  auto_release_at: string | null;
  settlement_status: string;
  reschedule_requested_at: string | null;
  reschedule_note: string | null;
  dispatch_photo_url: string | null;
  departure_notified_at: string | null;
  address_full_name: string;
  address_phone: string;
  address_street: string;
  address_city: string;
  address_region: string;
  payment_type: string;
  payment_label: string;
  payment_network: string | null;
  payment_phone: string | null;
  payment_last4: string | null;
  voucher_code: string | null;
  voucher_title: string | null;
  discount_amount: number;
  placed_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemRead[];
  return_requests: unknown[];
  timeline: OrderStatusEventRead[];
  packages: OrderPackageRead[];
};


// Delivery

export type DeliveryQuoteCartItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type DeliveryQuoteRequest = {
  subtotal: number;
  region?: string | null;
  city?: string | null;
  selected_method: "economy" | "express" | "same_day";
  items?: DeliveryQuoteCartItem[] | null;
};

export type DeliveryOptionRead = {
  id: "economy" | "express" | "same_day";
  title: string;
  subtitle: string;
  eta: string;
  amount: number;
  badge?: string | null;
  available: boolean;
  unavailable_reason?: string | null;
};

export type DeliveryPackageQuoteRead = {
  store_id?: string | null;
  store_name?: string | null;
  items_subtotal: number;
  delivery_fee: number;
  fee_waived: boolean;
  free_threshold: number;
  amount_to_free_delivery?: number | null;
};

export type DeliveryQuoteRead = {
  options: DeliveryOptionRead[];
  selected_method: "economy" | "express" | "same_day";
  shipping_amount: number;
  free_shipping_threshold: number;
  same_day_cutoff_passed: boolean;
  packages: DeliveryPackageQuoteRead[];
};


// Payments

export type CheckoutSessionCreate = {
  source: "buy_now" | "cart";
  items: OrderItemCreate[];
  subtotal_amount: number;
  shipping_amount: number;
  delivery_method: "economy" | "express" | "same_day";
  discount_amount: number;
  total_amount: number;
  voucher_code?: string | null;
  address_full_name: string;
  address_phone: string;
  address_street: string;
  address_city: string;
  address_region: string;
  delivery_instructions?: string | null;
  payment_type: string;
  payment_label: string;
  payment_network?: string | null;
  payment_phone?: string | null;
  payment_last4?: string | null;
  callback_url?: string | null;
  cancel_url?: string | null;
};

export type CheckoutSessionRead = {
  order_id: string;
  order_number: string;
  reference: string;
  authorization_url: string;
  access_code?: string | null;
  amount: number;
  currency: string;
  payment_status: string;
};

export type PaymentVerificationRead = {
  order: OrderRead;
  reference: string;
  payment_status: string;
  provider_status: string;
  paid_at?: string | null;
  verified_at?: string | null;
  message: string;
};
