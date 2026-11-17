"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * The Seller Center used to be one page with `?tab=` query params. Those links are in the wild
 * (and in the mobile app's web fallbacks), so they are forwarded to the route that replaced them
 * rather than silently landing on the dashboard.
 */
const LEGACY_TABS: Record<string, string> = {
  dashboard: "/seller",
  profile: "/seller/store",
  orders: "/seller/orders",
  products: "/seller/products",
  stock: "/seller/inventory",
  customers: "/seller/customers",
  returns: "/seller/returns",
  reviews: "/seller/reviews",
  chats: "/seller/chats",
  vouchers: "/seller/vouchers",
  wallet: "/seller/wallet",
};

export function LegacyTabRedirect() {
  const router = useRouter();
  const tab = useSearchParams().get("tab");

  useEffect(() => {
    const target = tab ? LEGACY_TABS[tab] : undefined;
    if (target && target !== "/seller") router.replace(target);
  }, [tab, router]);

  return null;
}
