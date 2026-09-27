
const isServer = typeof window === "undefined";

/** Logs once on the server (not in every visitor's console) when a variable is missing. */
function warnIfMissing(name: string, value: string | undefined, fallback?: string): void {
  if (!value && isServer && process.env.NODE_ENV !== "test") {
    console.warn(
      `[config] Missing environment variable: ${name}${fallback ? ` (using default: ${fallback})` : ""}`,
    );
  }
}

const DEFAULT_API_BASE_URL = "https://appbe.odos.market";
const DEFAULT_SITE_URL = "http://localhost:3000";

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
warnIfMissing("NEXT_PUBLIC_API_BASE_URL", NEXT_PUBLIC_API_BASE_URL, DEFAULT_API_BASE_URL);

const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
warnIfMissing("NEXT_PUBLIC_SITE_URL", NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL);

/** No trailing slash, so `${origin}/api` is always well formed. */
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

export const CONFIG = {
  /**
   * The ODOS backend origin (no `/api` suffix). Server render and the Next.js proxy call it directly;
   * the browser goes through the same-origin `API_PREFIX` path instead, because the backend only
   * allows whitelisted browser origins (CORS). See `apiBaseUrl()` in `libs/api-endpoint.ts`, which
   * reads this `CONFIG` — every base-URL lookup in the app goes through here, not its own env var.
   */
  API_BASE_URL: stripTrailingSlash(NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL),

  /** Path prefix of every backend route, and of the same-origin proxy that fronts it in the browser. */
  API_PREFIX: "/api",

  /** This app's own public origin — for metadata (OG/canonical URLs), robots and sitemap, never the API. */
  SITE_URL: stripTrailingSlash(NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL),

  /* ---- App-wide constants (not environment-specific) ---- */

  SITE_NAME: "ODOS",
  SITE_DESCRIPTION:
    "Shop from many local vendors, check out once. Each vendor delivers their part of your order.",

  /** Confirmed by the API itself: delivery quotes read "Free shipping on orders over GH₵0". */
  CURRENCY: "GHS",
  LOCALE: "en-GH",

  IS_PROD: !process.env.NODE_ENV || process.env.NODE_ENV === "production",
} as const;

export default CONFIG;
