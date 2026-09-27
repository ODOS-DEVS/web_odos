import type { NextConfig } from "next";
import CONFIG from "./utils/config";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // The backend only allows whitelisted browser origins (CORS), so the browser calls the same-origin
  // `/api/*` and Next proxies it. Server-side fetches call the API directly. Remove once the deployed
  // origin is added to the backend's CORS_ORIGINS and you prefer direct calls.
  async rewrites() {
    return [{ source: `${CONFIG.API_PREFIX}/:path*`, destination: `${CONFIG.API_BASE_URL}${CONFIG.API_PREFIX}/:path*` }];
  },
  // Some endpoints (e.g. /api/home-feed/) are defined with a trailing slash.
  skipTrailingSlashRedirect: true,
  images: {
    // Product, store and category images are hosted on Cloudinary, which resizes them itself.
    loader: "custom",
    loaderFile: "./libs/cloudinary-loader.ts",
  },
};

export default nextConfig;
