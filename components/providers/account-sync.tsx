"use client";

import { useCartSync, useWishlistSync } from "@/hooks/use-account-sync";
import { useSessionRefresh } from "@/hooks/use-auth";

/**
 * Keeps the signed-in user fresh (GET /auth/me) and mirrors the browser cart and favourites to the
 * shopper's account. Renders nothing.
 */
export function AccountSync() {
  useSessionRefresh();
  useCartSync();
  useWishlistSync();
  return null;
}
