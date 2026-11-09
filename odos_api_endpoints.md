# ODOS Mobile Backend — API Endpoints (v0.1.0)

Base URL: `https://appbe.odos.market/api` · Spec: `https://appbe.odos.market/openapi.json`
Paths below are relative to the base URL. 🔒 = requires auth (Bearer token).

## health
- GET `/health` — Health Check
- GET `/health/services` — Services Health Check
- GET `/health/payments` — Payments Health Check
- GET `/db-health` — Database Health Check

## auth
- POST `/auth/signup` — Signup
- POST `/auth/login` — Login
- POST `/auth/google` — Google Auth
- POST `/auth/verify-email` — Verify Email 🔒
- POST `/auth/forgot-password` — Forgot Password
- POST `/auth/verify-reset-code` — Verify Reset Code
- POST `/auth/reset-password` — Reset Password
- POST `/auth/resend-verification-code` — Resend Email Verification Code 🔒
- POST `/auth/phone/send-code` — Send Phone Verification Code 🔒
- POST `/auth/phone/verify` — Verify Phone 🔒
- GET `/auth/phone/verified` — List Verified Phones 🔒
- GET `/auth/me` — Me 🔒
- PATCH `/auth/me` — Update Me 🔒
- POST `/auth/logout` — Logout

## account
- GET `/account/addresses` — Get Saved Addresses 🔒
- POST `/account/addresses` — Create Saved Address 🔒
- PATCH `/account/addresses/{address_id}` — Update Saved Address 🔒
- DELETE `/account/addresses/{address_id}` — Delete Saved Address 🔒
- POST `/account/addresses/{address_id}/default` — Make Saved Address Default 🔒
- GET `/account/payment-methods` — Get Saved Payment Methods 🔒
- POST `/account/payment-methods` — Create Saved Payment Method 🔒
- POST `/account/payment-methods/{payment_method_id}/default` — Make Saved Payment Method Default 🔒
- DELETE `/account/payment-methods/{payment_method_id}` — Delete Saved Payment Method 🔒
- GET `/account/email-preferences` — Get Preferences 🔒
- PATCH `/account/email-preferences` — Update Preferences 🔒
- GET `/account/deletion-eligibility` — Read Account Deletion Eligibility 🔒
- DELETE `/account` — Delete Account 🔒

## cart
- GET `/cart` — Get Cart 🔒
- POST `/cart` — Create Cart Item 🔒
- DELETE `/cart` — Clear Cart 🔒
- PATCH `/cart/{product_id}` — Patch Cart Item 🔒
- DELETE `/cart/{product_id}` — Delete Cart Item 🔒

## wishlist
- GET `/wishlist` — Get Wishlist 🔒
- POST `/wishlist` — Create Wishlist Item 🔒
- DELETE `/wishlist/{product_id}` — Delete Wishlist Item 🔒

## catalog
- GET `/catalog/categories` — Get Categories
- GET `/catalog/products` — Get Products
- GET `/catalog/products/{product_id}` — Get Product
- GET `/catalog/search` — Search 🔒
- GET `/catalog/markets` — Get Markets
- GET `/catalog/stores` — Get Stores
- GET `/catalog/stores/{store_id}` — Get Store By Id
- GET `/catalog/stores/{store_id}/sections` — Get Store Sections
- GET `/catalog/deals-hub` — Get Deals Hub 🔒
- GET `/catalog/campaign-tags` — Get Campaign Tags
- GET `/catalog/campaigns` — Get Merchandising Campaigns
- GET `/catalog/campaigns/{slug}` — Get Merchandising Campaign Detail
- GET `/catalog/deal-products` — Get Deal Products
- GET `/catalog/promo-banners` — Get Promo Banners
- GET `/catalog/flash-sale-events/active` — Get Active Flash Sale Events
- GET `/catalog/flash-sale-events/{slug}/products` — Get Flash Sale Event Products

## home-feed
- GET `/home-feed/` — Get Home Feed 🔒
- GET `/home-feed/section/{section_key}` — Get Feed Section 🔒

## recommendations
- GET `/recommendations/for-you` — Get For You Feed 🔒
- GET `/recommendations/similar/{product_id}` — Get Similar Feed 🔒

## reviews
- GET `/reviews/products/{product_id}` — Get Product Reviews
- GET `/reviews/me` — Get My Reviews 🔒
- POST `/reviews` — Post Review 🔒

## vouchers
- GET `/vouchers/promotions` — Get Public Promotions
- GET `/vouchers/stores/{store_id}` — Get Store Vouchers
- GET `/vouchers/me` — Get My Vouchers 🔒
- POST `/vouchers/{voucher_id}/claim` — Claim Voucher 🔒
- POST `/vouchers/calculate` — Calculate Promotions 🔒
- POST `/vouchers/preview` — Voucher Preview 🔒
- POST `/vouchers/suggestions` — Voucher Suggestions 🔒

## promotions
- POST `/promotions/events/batch` — Post Promo Analytics Batch 🔒

## behavior
- POST `/behavior/events/batch` — Post Behavior Event Batch 🔒

## assistant
- GET `/assistant/status` — Assistant Status
- GET `/assistant/session` — Assistant Session 🔒
- POST `/assistant/chat` — Assistant Chat 🔒
- POST `/assistant/chat/stream` — Assistant Chat Stream 🔒
- POST `/assistant/feedback` — Assistant Feedback 🔒

## delivery
- POST `/delivery/quote` — Delivery Quote

## chat
- GET `/chat/threads` — Get Chat Threads 🔒
- POST `/chat/threads/store/{store_id}` — Create Or Get Store Thread 🔒
- POST `/chat/threads/support` — Create Or Get Support Thread 🔒
- GET `/chat/threads/{thread_id}/messages` — Get Thread Messages 🔒
- POST `/chat/threads/{thread_id}/messages` — Create Thread Message 🔒
- DELETE `/chat/messages/{message_id}` — Delete Thread Message 🔒
- PATCH `/chat/threads/{thread_id}/support-status` — Patch Support Thread Status 🔒

## notifications
- GET `/notifications/read-state` — Get Notification Read State 🔒
- POST `/notifications/read-state` — Mark Notification Read State 🔒
- GET `/notifications` — Get Notifications 🔒
- POST `/notifications/push-token` — Save Push Token 🔒
- DELETE `/notifications/push-token` — Clear Push Token 🔒

## orders
- GET `/orders` — Get Orders 🔒
- POST `/orders` — Create New Order 🔒
- GET `/orders/{order_id}` — Get Order By Id 🔒
- DELETE `/orders/{order_id}` — Delete Existing Order 🔒
- PATCH `/orders/{order_id}/cancel` — Cancel Order 🔒
- PATCH `/orders/{order_id}/deliver` — Confirm Order Delivery 🔒
- PATCH `/orders/{order_id}/packages/{package_id}/deliver` — Confirm Order Package Delivery 🔒
- POST `/orders/{order_id}/delivery-problem` — Report Delivery Problem 🔒
- PATCH `/orders/{order_id}/delivery-rating` — Submit Delivery Rating 🔒
- POST `/orders/{order_id}/reschedule` — Request Delivery Reschedule 🔒
- POST `/orders/{order_id}/returns` — Create Order Return Request 🔒

## payments
- POST `/payments/checkout` — Initialize Checkout Payment 🔒
- POST `/payments/checkout/{reference}/verify` — Verify Checkout Payment 🔒
- POST `/payments/paystack/webhook` — Receive Paystack Webhook
- GET `/payments/paystack/redirect` — Paystack Checkout Redirect
- POST `/payments/kutanapay/checkout` — Initialize Kutanapay Checkout 🔒
- POST `/payments/kutanapay/webhook` — Kutanapay Webhook

## payment-methods
- GET `/payment-methods/available` — List Available Payment Methods 🔒
- POST `/payment-methods/initiate` — Initiate Payment 🔒
- POST `/payment-methods/verify` — Verify Payment 🔒

## wallet
- GET `/wallet/customer` — Get Customer Wallet 🔒
- POST `/wallet/customer/topups/checkout` — Create Wallet Topup Session 🔒
- POST `/wallet/customer/topups/{reference}/verify` — Verify Wallet Topup 🔒
- POST `/wallet/customer/checkout` — Checkout With Customer Wallet 🔒

## loyalty
- GET `/loyalty/account` — Get Account 🔒
- GET `/loyalty/history` — Get History 🔒
- POST `/loyalty/redeem` — Redeem Points 🔒
- POST `/loyalty/admin/award` — Award Bonus Points 🔒

## guides
- GET `/guides/videos` — Guide Videos

## vendor
- POST `/vendor/applications` — Create Vendor Application 🔒
- GET `/vendor/applications/me` — Get My Vendor Application 🔒
- GET `/vendor/me` — Get Vendor Profile 🔒
- GET `/vendor/dashboard` — Get Vendor Dashboard 🔒
- GET `/vendor/analytics` — Get Vendor Analytics 🔒
- GET `/vendor/reviews` — Get Vendor Reviews 🔒
- PATCH `/vendor/reviews/{review_id}/reply` — Reply to Review 🔒
- GET `/vendor/customers` — Get Vendor Customers 🔒
- GET `/vendor/returns` — Get Vendor Returns 🔒
- GET `/vendor/returns/{return_request_id}` — Get Vendor Return Detail 🔒
- PATCH `/vendor/returns/{return_request_id}` — Patch Vendor Return 🔒
- GET `/vendor/wallet` — Get Vendor Wallet 🔒
- GET `/vendor/wallet/payout-institutions` — Get Payout Institutions 🔒
- PATCH `/vendor/wallet/payout-details` — Patch Payout Details 🔒
- POST `/vendor/wallet/withdrawals` — Post Wallet Withdrawal 🔒
- GET `/vendor/products` — Get Vendor Products 🔒
- POST `/vendor/products` — Add Vendor Product 🔒
- GET `/vendor/products/performance` — Get Product Performance 🔒
- PATCH `/vendor/products/bulk` — Patch Products Bulk 🔒
- PATCH `/vendor/products/{product_id}` — Patch Vendor Product 🔒
- DELETE `/vendor/products/{product_id}` — Remove Vendor Product 🔒
- PATCH `/vendor/products/{product_id}/status` — Patch Product Status 🔒
- PATCH `/vendor/products/{product_id}/stock` — Patch Product Stock 🔒
- GET `/vendor/products/{product_id}/inventory-movements` — Get Product Inventory Movements 🔒
- GET `/vendor/inventory-movements` — Get Inventory Feed 🔒
- GET `/vendor/orders` — Get Vendor Orders 🔒
- GET `/vendor/orders/{order_id}` — Get Vendor Order Detail 🔒
- POST `/vendor/orders/{order_id}/acknowledge` — Acknowledge Order 🔒
- PATCH `/vendor/orders/{order_id}/status` — Patch Order Status 🔒
- POST `/vendor/orders/{order_id}/dispatch-photo` — Post Dispatch Photo 🔒
- POST `/vendor/orders/{order_id}/notify-departure` — Notify Departure 🔒
- POST `/vendor/orders/{order_id}/request-courier` — Request Courier 🔒
- GET `/vendor/vouchers` — Get Vendor Vouchers 🔒
- POST `/vendor/vouchers` — Post Vendor Voucher 🔒
- PATCH `/vendor/vouchers/{voucher_id}` — Patch Vendor Voucher 🔒
- DELETE `/vendor/vouchers/{voucher_id}` — Delete Vendor Voucher 🔒
- POST `/vendor/vouchers/{voucher_id}/gift` — Gift Voucher 🔒
- GET `/vendor/vouchers/{voucher_id}/redemptions` — Get Voucher Redemptions 🔒
- GET `/vendor/flash-sale-nominations` — Get Flash Sale Nominations 🔒
- POST `/vendor/flash-sale-nominations` — Post Flash Sale Nomination 🔒
- GET `/vendor/merchandising-campaigns/open` — Get Open Merchandising Campaigns 🔒
- GET `/vendor/merchandising-campaign-opt-ins` — Get Campaign Opt-Ins 🔒
- POST `/vendor/merchandising-campaign-opt-ins` — Post Campaign Opt-In 🔒
- GET `/vendor/delivery-settings` — Get Delivery Settings 🔒
- PATCH `/vendor/delivery-settings` — Patch Delivery Settings 🔒
- GET `/vendor/store` — Get Store Profile 🔒
- PATCH `/vendor/store` — Patch Store 🔒
- GET `/vendor/store/sections` — Get Store Sections 🔒
- POST `/vendor/store/sections` — Post Store Section 🔒
- GET `/vendor/store/sections/starter-suggestions` — Get Section Suggestions 🔒
- POST `/vendor/store/sections/reorder` — Reorder Sections 🔒
- PATCH `/vendor/store/sections/{section_id}` — Patch Store Section 🔒
- DELETE `/vendor/store/sections/{section_id}` — Delete Store Section 🔒
- GET `/vendor/store/sections/{section_id}/products` — Get Section Products 🔒
- POST `/vendor/store/sections/{section_id}/products` — Add Section Products 🔒
- DELETE `/vendor/store/sections/{section_id}/products/{product_id}` — Remove Section Product 🔒

## vendor-analytics
- GET `/vendor/analytics/vouchers` — Voucher Analytics 🔒
- GET `/vendor/analytics/campaigns` — Campaign Analytics 🔒
- GET `/vendor/analytics/promotions/overview` — Promo Overview 🔒
- GET `/vendor/analytics/promotions/timeseries` — Promo Timeseries 🔒
- GET `/vendor/analytics/promotions/leaderboard` — Promo Leaderboard 🔒

## vendor-campaigns
- GET `/vendor/campaigns` — List My Campaigns 🔒
- POST `/vendor/campaigns` — Create My Campaign 🔒
- GET `/vendor/campaigns/{campaign_id}` — Get My Campaign 🔒
- PUT `/vendor/campaigns/{campaign_id}` — Update My Campaign 🔒

## vendor-inventory
- GET `/vendor/inventory/` — List Inventory 🔒
- GET `/vendor/inventory/stats` — Get Stats 🔒
- PATCH `/vendor/inventory/products/{product_id}/stock` — Update Stock 🔒
- PATCH `/vendor/inventory/products/{product_id}/price` — Update Price 🔒
- POST `/vendor/inventory/bulk-update` — Bulk Update 🔒
- GET `/vendor/inventory/alerts/low-stock` — Low-Stock Alerts 🔒

## courier
- GET `/courier/me` — Get My Courier Profile 🔒
- POST `/courier/profile` — Post Courier Profile 🔒
- PATCH `/courier/status` — Patch Courier Status 🔒
- PATCH `/courier/location` — Patch Courier Location 🔒
- GET `/courier/pool` — Get Delivery Pool 🔒
- POST `/courier/pool/{offer_id}/claim` — Claim Delivery Offer 🔒
- GET `/courier/deliveries/active` — Get Active Delivery 🔒
- GET `/courier/deliveries/history` — Get Delivery History 🔒
- GET `/courier/deliveries/{delivery_id}` — Get Delivery 🔒
- POST `/courier/deliveries/{delivery_id}/start-pickup` — Heading to the vendor 🔒
- POST `/courier/deliveries/{delivery_id}/arrive-at-pickup` — Arrived at the vendor 🔒
- POST `/courier/deliveries/{delivery_id}/begin-pickup-verification` — Verify handover with vendor 🔒
- POST `/courier/deliveries/{delivery_id}/start-dropoff` — Heading to the customer 🔒
- POST `/courier/deliveries/{delivery_id}/arrive-at-customer` — Arrived at the customer 🔒
- POST `/courier/deliveries/{delivery_id}/begin-delivery-verification` — Take customer's delivery code 🔒
- POST `/courier/deliveries/{delivery_id}/report-customer-unavailable` — Customer unreachable 🔒
- POST `/courier/deliveries/{delivery_id}/fail-delivery` — Delivery could not be completed 🔒
- POST `/courier/deliveries/{delivery_id}/start-return` — Return order to vendor 🔒
- POST `/courier/deliveries/{delivery_id}/release` — Hand delivery back to pool 🔒

## email-marketing
- POST `/email-marketing/send` — Send Email 🔒
- POST `/email-marketing/campaigns/abandoned-cart` — Abandoned Cart Campaign 🔒
- POST `/email-marketing/campaigns/reengagement` — Reengagement Campaign 🔒
- POST `/email-marketing/campaigns/welcome` — Welcome Campaign 🔒
- POST `/email-marketing/notifications/loyalty` — Send Loyalty Notification 🔒
- GET `/email-marketing/templates` — List Email Templates 🔒

## customer-segmentation
- GET `/customer-segmentation/user/{user_id}` — Get User Profile 🔒
- GET `/customer-segmentation/segment/{segment}` — Get Segment Users 🔒
- GET `/customer-segmentation/segment/{segment}/stats` — Get Segment Stats 🔒
- GET `/customer-segmentation/segment/{segment}/export` — Export Segment 🔒
- GET `/customer-segmentation/overview` — Get Overview 🔒
- GET `/customer-segmentation/churn-risk` — Get Churn Risk 🔒

## admin-analytics
- GET `/admin/analytics/customers` — Customers Metrics 🔒
- GET `/admin/analytics/revenue` — Revenue 🔒
- GET `/admin/analytics/products` — Products Metrics 🔒
- GET `/admin/analytics/inventory` — Inventory 🔒
- GET `/admin/analytics/categories` — Categories 🔒
- GET `/admin/analytics/vendors` — Vendors Metrics 🔒

## admin
**Auth & profile**
- GET `/admin/auth/bootstrap-status` — Bootstrap Status
- POST `/admin/auth/bootstrap-signup` — Bootstrap Signup
- POST `/admin/auth/login` — Admin Login
- GET `/admin/auth/me` — Admin Me 🔒
- PATCH `/admin/auth/me` — Patch Admin Me 🔒

**Dashboard**
- GET `/admin/dashboard` — Dashboard 🔒
- GET `/admin/dashboard/sales-chart` — Sales Chart 🔒
- GET `/admin/dashboard/top-vendors` — Top Vendors 🔒
- GET `/admin/dashboard/kpi-metrics` — KPI Metrics 🔒

**Users & staff**
- GET `/admin/users` — Get Users 🔒
- GET `/admin/users/{user_id}` — Get User 🔒
- PATCH `/admin/users/{user_id}/status` — Patch User Status 🔒
- PATCH `/admin/users/{user_id}/permission` — Patch User Permission 🔒
- GET `/admin/staff` — Get Admin Staff 🔒
- POST `/admin/staff` — Create Admin Staff 🔒

**Vendors, stores, markets**
- GET `/admin/vendors` — Get Vendors 🔒
- GET `/admin/vendors/{vendor_id}` — Get Vendor 🔒
- PATCH `/admin/vendors/{vendor_id}/status` — Patch Vendor Status 🔒
- GET `/admin/vendor-applications` — Get Vendor Applications 🔒
- PATCH `/admin/vendor-applications/{application_id}/approve` — Approve Application 🔒
- PATCH `/admin/vendor-applications/{application_id}/reject` — Reject Application 🔒
- GET `/admin/stores` — Get Stores 🔒
- POST `/admin/stores` — Create Store 🔒
- GET `/admin/stores/{store_id}` — Get Store 🔒
- PATCH `/admin/stores/{store_id}/status` — Patch Store Status 🔒
- GET `/admin/markets` — Get Markets 🔒
- POST `/admin/markets` — Create Market 🔒
- PATCH `/admin/markets/{market_id}` — Patch Market 🔒
- DELETE `/admin/markets/{market_id}` — Remove Market 🔒

**Catalog**
- GET `/admin/categories` — Get Categories 🔒
- POST `/admin/categories` — Create Category 🔒
- PATCH `/admin/categories/{category_id}` — Patch Category 🔒
- DELETE `/admin/categories/{category_id}` — Remove Category 🔒
- GET `/admin/products` — Get Products 🔒
- POST `/admin/products` — Create Product 🔒
- GET `/admin/products/{product_id}` — Get Product 🔒
- PATCH `/admin/products/{product_id}` — Patch Product 🔒
- PATCH `/admin/products/{product_id}/status` — Patch Product Status 🔒
- GET `/admin/reviews` — Get Reviews 🔒
- PATCH `/admin/reviews/{review_id}/moderation` — Moderate Review 🔒

**Merchandising & promotions**
- GET `/admin/promo-banners` — Get Promo Banners 🔒
- POST `/admin/promo-banners` — Create Promo Banner 🔒
- GET `/admin/promo-banners/{banner_id}` — Get Promo Banner 🔒
- PATCH `/admin/promo-banners/{banner_id}` — Patch Promo Banner 🔒
- DELETE `/admin/promo-banners/{banner_id}` — Remove Promo Banner 🔒
- GET `/admin/flash-sale-events` — Get Flash Sale Events 🔒
- POST `/admin/flash-sale-events` — Create Flash Sale Event 🔒
- PATCH `/admin/flash-sale-events/{event_id}` — Patch Flash Sale Event 🔒
- DELETE `/admin/flash-sale-events/{event_id}` — Remove Flash Sale Event 🔒
- GET `/admin/flash-sale-nominations` — Get Flash Sale Nominations 🔒
- POST `/admin/flash-sale-nominations/{nomination_id}/review` — Review Nomination 🔒
- GET `/admin/merchandising-campaigns` — Get Merchandising Campaigns 🔒
- POST `/admin/merchandising-campaigns` — Create Merchandising Campaign 🔒
- GET `/admin/merchandising-campaigns/{campaign_id}` — Get Merchandising Campaign 🔒
- PATCH `/admin/merchandising-campaigns/{campaign_id}` — Patch Merchandising Campaign 🔒
- DELETE `/admin/merchandising-campaigns/{campaign_id}` — Remove Merchandising Campaign 🔒
- POST `/admin/merchandising-campaigns/{campaign_id}/duplicate` — Duplicate Campaign 🔒
- GET `/admin/merchandising-campaign-opt-ins` — Get Campaign Opt-Ins 🔒
- POST `/admin/merchandising-campaign-opt-ins/{opt_in_id}/review` — Review Opt-In 🔒

**Vouchers & promo analytics**
- GET `/admin/vouchers` — Get Vouchers 🔒
- POST `/admin/vouchers` — Create Voucher 🔒
- PATCH `/admin/vouchers/{voucher_id}` — Patch Voucher 🔒
- DELETE `/admin/vouchers/{voucher_id}` — Remove Voucher 🔒
- POST `/admin/vouchers/{voucher_id}/pause` — Pause Voucher 🔒
- POST `/admin/vouchers/{voucher_id}/resume` — Resume Voucher 🔒
- POST `/admin/vouchers/{voucher_id}/duplicate` — Duplicate Voucher 🔒
- POST `/admin/vouchers/{voucher_id}/review` — Review Voucher 🔒
- POST `/admin/vouchers/bulk-generate` — Bulk Generate Vouchers 🔒
- GET `/admin/vouchers/analytics` — Voucher Analytics 🔒
- GET `/admin/promo-analytics/overview` — Promo Analytics Overview 🔒
- GET `/admin/promo-analytics/timeseries` — Promo Analytics Timeseries 🔒
- GET `/admin/promo-analytics/leaderboard` — Promo Analytics Leaderboard 🔒

**Orders, returns, finance, payouts**
- GET `/admin/orders` — Get Orders 🔒
- GET `/admin/orders/delivery-ops` — Get Delivery Ops 🔒
- GET `/admin/orders/{order_id}` — Get Order 🔒
- PATCH `/admin/orders/{order_id}/status` — Patch Order Status 🔒
- GET `/admin/returns` — Get Return Requests 🔒
- GET `/admin/returns/{request_id}` — Get Return Request 🔒
- PATCH `/admin/returns/{request_id}` — Patch Return Request 🔒
- GET `/admin/finance/overview` — Finance Overview 🔒
- GET `/admin/finance/reconciliation` — Finance Reconciliation 🔒
- GET `/admin/finance/payments` — Finance Payments 🔒
- GET `/admin/finance/ledger` — Finance Ledger 🔒
- GET `/admin/payouts/withdrawals` — Vendor Withdrawal Requests 🔒
- PATCH `/admin/payouts/withdrawals/{request_id}` — Patch Withdrawal Request 🔒

**Settings, notifications, logs, guides**
- GET `/admin/notifications` — Get Notifications 🔒
- PATCH `/admin/notifications/{notification_id}/read` — Mark Notification Read 🔒
- GET `/admin/delivery-settings` — Get Delivery Settings 🔒
- PATCH `/admin/delivery-settings` — Update Delivery Settings 🔒
- GET `/admin/event-logs` — Event Logs 🔒
- GET `/admin/event-logs/stats` — Event Log Stats 🔒
- GET `/admin/guides/catalog` — Guide Catalog 🔒
- GET `/admin/guides/videos` — Guide Videos 🔒
- POST `/admin/guides/videos` — Create Guide Video 🔒
- PATCH `/admin/guides/videos/{video_id}` — Update Guide Video 🔒
- DELETE `/admin/guides/videos/{video_id}` — Delete Guide Video 🔒
- POST `/admin/guides/videos/upload-signature` — Guide Video Upload Signature 🔒
