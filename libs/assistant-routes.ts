/**
 * The assistant returns Expo Router paths, because it was built for the phone — `/screens/deals`,
 * `/screens/productDetails/[id]`, and so on. Rendering those on the web would produce dead links,
 * so each one is translated to its web route here.
 *
 * An unmapped route yields `null` and the action is dropped rather than shown as a link that
 * goes nowhere. Keep this in step with the routes in `app/routes/assistant.py`.
 */
const EXACT: Record<string, string> = {
  "/screens/deals": "/deals",
  "/screens/search": "/products",
  "/screens/market": "/market",
  "/screens/flash-sales": "/deals",
  "/screens/new-products": "/products?tag=new",
  "/screens/popular": "/products",
  "/screens/promo-deals": "/deals",
  "/screens/Checkout": "/checkout",
  "/screens/Notification": "/notifications",
  "/(tabs)/cart": "/cart",
  "/(tabs)/wishlist": "/wishlist",
  "/(tabs)/index": "/",
  "/(tabs)/category": "/categories",
  "/(tabs)/profile": "/account",
  "/screens/profileScreens/orders": "/orders",
  "/screens/profileScreens/Account/Vouchers": "/account?tab=vouchers",
  "/screens/profileScreens/Account/Chats": "/account?tab=chats",
  "/screens/profileScreens/helpAndSupport/FAQ": "/help",
  "/screens/profileScreens/helpAndSupport/GetHelp": "/help",
};

/** Mobile dynamic segments → web equivalents, matched after the exact table misses. */
const PATTERNS: { test: RegExp; build: (m: RegExpMatchArray) => string }[] = [
  { test: /^\/screens\/productDetails\/(.+)$/, build: (m) => `/products/${m[1]}` },
  { test: /^\/screens\/categories\/(.+)$/, build: (m) => `/categories/${m[1]}` },
  { test: /^\/screens\/markets\/(.+)$/, build: (m) => `/market?market=${encodeURIComponent(m[1])}` },
  { test: /^\/screens\/campaigns\/(.+)$/, build: (m) => `/campaigns/${m[1]}` },
  { test: /^\/screens\/product-reviews\/(.+)$/, build: (m) => `/products/${m[1]}` },
  { test: /^\/screens\/profileScreens\/orders\/(.+)$/, build: (m) => `/orders/${m[1]}` },
  { test: /^\/stores?\/(.+)$/, build: (m) => `/stores/${m[1]}` },
];

export function toWebRoute(route: string, params?: Record<string, string> | null): string | null {
  const clean = route.trim();
  if (!clean) return null;

  // Already a web path we serve.
  if (EXACT[clean]) return withParams(EXACT[clean], params);

  for (const { test, build } of PATTERNS) {
    const match = clean.match(test);
    if (match) return withParams(build(match), params);
  }

  // A bare "/products"-style path the assistant may already emit correctly.
  if (/^\/(products|stores|deals|categories|market|cart|orders|wishlist|help|account|notifications)(\/|\?|$)/.test(clean)) {
    return withParams(clean, params);
  }

  return null;
}

function withParams(href: string, params?: Record<string, string> | null) {
  if (!params || !Object.keys(params).length) return href;
  const query = new URLSearchParams(params).toString();
  return href.includes("?") ? `${href}&${query}` : `${href}?${query}`;
}
