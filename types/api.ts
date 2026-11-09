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

/** POST /auth/verify-reset-code → a short-lived token that authorises POST /auth/reset-password. */
export type PasswordResetTokenResponse = { message: string; reset_token: string };

export type VerifiedPhonesResponse = { phones: string[] };

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

/** GET /catalog/promo-banners. `accent` is a free-form colour; `cta_link` may be relative or absolute. */
export type PromoBannerRead = {
  id: string;
  title: string;
  subtitle?: string | null;
  cta_label: string;
  cta_link?: string | null;
  image_url?: string | null;
  accent?: string | null;
  sort_order: number;
  campaign_tag?: string | null;
  link_type?: string | null;
  placement?: string | null;
};

/** GET /catalog/campaigns. */
export type MerchandisingCampaignRead = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  banner_image_url?: string | null;
  thumbnail_image_url?: string | null;
  icon_key?: string | null;
  theme_color?: string | null;
  is_featured?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  display_priority?: number;
  product_count?: number;
  seconds_remaining?: number;
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

/** GET /recommendations/similar/{id} (works signed out; personalised when signed in). */
export type RecommendationFeedRead = {
  title: string;
  subtitle?: string | null;
  personalized?: boolean;
  products: ProductRead[];
};

/** GET /catalog/search — results arrive ranked by relevance. */
export type SearchResponseRead = {
  query: string;
  results: { product: ProductRead; relevance_score?: number; reason?: string | null }[];
  total_count: number;
  has_more: boolean;
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
  return_requests: ReturnRequestRead[];
  timeline: OrderStatusEventRead[];
  packages: OrderPackageRead[];
};

export type ReturnRequestRead = {
  id: string;
  order_id: string;
  order_item_id: string;
  user_id?: string;
  request_type: string;
  status: string;
  quantity: number;
  reason: string;
  details?: string | null;
  evidence_image_urls?: string[] | null;
  admin_note?: string | null;
  refund_amount?: number | null;
  reviewed_by_user_id?: string | null;
  reviewed_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ReturnRequestCreate = {
  order_item_id: string;
  request_type: "refund" | "exchange" | "return";
  quantity: number;
  reason: string;
  details?: string | null;
  evidence_image_urls?: string[] | null;
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

// Cart & wishlist (login required). Money arrives as decimal strings here.

export type CartItemRead = {
  id: string;
  product_id: string;
  title: string;
  image_url: string | null;
  image_key: string | null;
  category: string | null;
  price: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type CartItemCreate = {
  product_id: string;
  title: string;
  price: string;
  image_url?: string | null;
  image_key?: string | null;
  category?: string | null;
  quantity?: number;
};

export type WishlistItemRead = {
  id: string;
  product_id: string;
  title: string;
  image_url: string | null;
  category: string | null;
  price: string | null;
  old_price: string | null;
  rating: string | null;
  reviews: string | null;
  created_at: string;
};

export type WishlistItemCreate = {
  product_id: string;
  title: string;
  image_url?: string | null;
  category?: string | null;
  price?: string | null;
  old_price?: string | null;
  rating?: string | null;
  reviews?: string | null;
};

// Vouchers

export type StoreVoucherRead = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  issuer_name?: string | null;
  scope: string;
  availability: string;
  store_id?: string | null;
  store_name?: string | null;
  reward_text: string;
  min_subtotal: number;
  expires_at?: string | null;
  claimed?: boolean;
  campaign_tag?: string | null;
  discount_type?: string | null;
  approval_status?: string | null;
};

export type VoucherWalletRead = Omit<StoreVoucherRead, "claimed" | "campaign_tag" | "discount_type" | "approval_status"> & {
  status: string;
  source?: string | null;
};

// Reviews written by the signed-in shopper

/** POST /reviews. Only for a product in one of the shopper's own orders. */
export type ReviewUpsert = { order_id: string; product_id: string; rating: number; comment: string };

export type UserReviewRead = {
  id: string;
  order_id: string;
  order_number: string;
  product_id: string;
  title: string;
  category?: string | null;
  image_key?: string | null;
  image_url?: string | null;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

// Chat

export type ChatThreadRead = {
  id: string;
  customer_user_id: string;
  vendor_user_id: string;
  thread_type?: string;
  store: { id: string; title: string; image_key?: string | null; image_url?: string | null };
  counterpart: { user_id: string; name: string; avatar_url?: string | null; role: string };
  subject?: string | null;
  product?: { id?: string | null; title?: string | null; image_url?: string | null } | null;
  support_status?: string | null;
  last_message_text?: string | null;
  last_message_at?: string | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
};

/** Body of POST /chat/threads/store/{store_id}: optional product the conversation is about. */
export type ChatThreadEnsurePayload = {
  product_id?: string | null;
  product_title?: string | null;
  product_image_url?: string | null;
};

export type ChatMessageRead = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_role: string;
  body: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  attachment_duration_seconds?: number | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

// Wallet & saved addresses

export type WalletTransactionRead = {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  reference?: string | null;
  method_label?: string | null;
  created_at: string;
};

export type WalletTopupSessionCreate = {
  amount: number;
  payment_method_id?: string | null;
  callback_url?: string | null;
};

export type WalletTopupSessionRead = {
  reference: string;
  authorization_url?: string | null;
  message?: string;
  status: string;
};

export type SavedPaymentMethodRead = {
  id: string;
  type: "momo" | "card" | string;
  label: string;
  is_default: boolean;
  network?: ("MTN" | "Telecel" | "AT") | string | null;
  phone?: string | null;
  card_name?: string | null;
  card_last4?: string | null;
  expiry?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  // Aliases for compatibility
  payment_type?: "momo" | "card" | string;
  payment_label?: string;
  payment_network?: string | null;
  payment_phone?: string | null;
  payment_last4?: string | null;
  card_expiry?: string | null;
};

export type SavedPaymentMethodCreate = {
  type: "momo" | "card";
  label?: string | null;
  is_default: boolean;
  network?: ("MTN" | "Telecel" | "AT") | null;
  phone?: string | null;
  card_name?: string | null;
  card_last4?: string | null;
  expiry?: string | null;
  // Aliases for compatibility
  payment_type?: "momo" | "card" | string;
  payment_label?: string;
  payment_network?: string | null;
  payment_phone?: string | null;
  payment_last4?: string | null;
  card_expiry?: string | null;
};

// Loyalty Rewards
export type LoyaltyAccountRead = {
  points_balance: number;
  lifetime_points: number;
  tier_name: string;
  tier_multiplier?: number;
  point_cedi_value?: number;
  next_tier_name?: string | null;
  points_to_next_tier?: number | null;
};

export type LoyaltyHistoryEntryRead = {
  id: string;
  points: number;
  type: string;
  reason: string;
  order_id?: string | null;
  created_at: string;
};

export type LoyaltyRedeemInput = {
  points: number;
};

export type LoyaltyRedeemRead = {
  points_redeemed: number;
  points_balance_after: number;
  discount_code?: string;
  amount_off?: number;
  message?: string;
};

export type CustomerWalletRead = {
  id: string;
  user_id: string;
  currency: string;
  available_balance: number;
  lifetime_topups: number;
  lifetime_spend: number;
  lifetime_refunds: number;
  recent_transactions: WalletTransactionRead[];
};

/** POST /wallet/customer/checkout — same order fields as a hosted checkout, paid from the wallet. */
export type WalletCheckoutCreate = Omit<CheckoutSessionCreate, "callback_url" | "cancel_url">;

export type WalletCheckoutRead = { order: OrderRead; wallet_balance_after: number; message: string };

export type AddressRead = {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  street: string;
  gps_code: string | null;
  city: string;
  region: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

// Vendor catalogue (vendor role required)

export type VendorProductRead = {
  id: string;
  store_id: string;
  vendor_id: string;
  name: string;
  description: string;
  category: string;
  category_slug?: string | null;
  subcategory?: string | null;
  /** Whole cedis. */
  price: number;
  old_price?: number | null;
  discount?: string | null;
  stock: number;
  reserved_stock?: number;
  available_stock?: number;
  image_key: string;
  image_url: string | null;
  image_urls?: string[] | null;
  placement_tags?: string[] | null;
  color_options?: string[] | null;
  size_options?: string[] | null;
  specifications?: string[] | null;
  is_returnable: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

// Flash sales

/** GET /catalog/flash-sale-events/active. */
export type FlashSaleEventRead = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  starts_at?: string | null;
  ends_at: string;
  sort_order: number;
  product_count?: number;
  /** Server-computed at response time; prefer `ends_at` for a live countdown. */
  seconds_remaining?: number;
};
