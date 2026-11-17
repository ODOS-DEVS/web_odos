"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, vendorQueries } from "@/services/queries";
import { vendorOpsService } from "@/services/vendor-ops.service";
import { useSession } from "./use-auth";
import { useChatThreads } from "./use-chats";
import { useNotifications } from "./use-notifications";
import { useProviderBookings } from "./use-services";
import { countVendorOrdersByQueue } from "@/libs/vendor-orders";
import type { VendorNavCountKey } from "@/components/vendor/vendor-nav";

/**
 * The badge numbers on the sidebar.
 *
 * Every source here is already fetched elsewhere in the portal, so these resolve from cache
 * rather than adding requests — the counts simply read whatever the pages have loaded.
 */
export function useVendorPortalCounts(): Record<VendorNavCountKey, number> {
  const enabled = Boolean(useSession());
  const orders = useQuery({ ...vendorQueries.orders(), enabled });
  const products = useQuery({ ...vendorQueries.products(), enabled });
  const returns = useQuery({ queryKey: queryKeys.vendorReturns, queryFn: () => vendorOpsService.returns(), enabled });
  const { unreadCount: chats } = useChatThreads();
  // Service bookings waiting on the provider. The services API is not deployed everywhere, so a
  // failure here resolves to zero rather than breaking the sidebar.
  const bookings = useProviderBookings();
  const { unreadCount: notifications } = useNotifications();

  const rows = orders.data ?? [];
  const openReturns = (returns.data ?? []).filter(
    (r) => r.status !== "completed" && r.status !== "rejected" && r.status !== "cancelled",
  ).length;

  return {
    // Work the vendor owes someone: new orders waiting to be picked up.
    orders: countVendorOrdersByQueue(rows).new,
    returns: openReturns,
    chats,
    notifications,
    lowStock: (products.data ?? []).filter((p) => isLowStock(p.stock)).length,
    bookings: (bookings.data ?? []).filter((b) => b.status === "pending_provider").length,
  };
}

/**
 * Mirrors `LOW_STOCK_THRESHOLD` in the backend's `app/services/inventory_service.py`, including
 * its exclusive lower bound: zero is *out* of stock, which the dashboard counts separately.
 * Counted on `stock` rather than `availableStock` so the sidebar badge and the dashboard's
 * server-computed `lowStockCount` can never disagree.
 */
export const LOW_STOCK_THRESHOLD = 2;

export const isLowStock = (stock: number) => stock > 0 && stock <= LOW_STOCK_THRESHOLD;
export const isOutOfStock = (stock: number) => stock <= 0;
