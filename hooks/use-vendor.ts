"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorService, type VendorProductCreate, type VendorProductUpdate } from "@/services/vendor.service";
import { queryKeys, vendorQueries } from "@/services/queries";
import { isActive } from "@/libs/orders";
import type { SellerStats, VendorProduct, VendorProductStatus } from "@/types/vendor";
import { useSession } from "./use-auth";

/** Everything in the seller centre is private, so every query here waits for a session. */
function useVendorGate() {
  return Boolean(useSession());
}

export function useVendorStore() {
  return useQuery({ ...vendorQueries.store(), enabled: useVendorGate() });
}

export function useVendorProducts() {
  return useQuery({ ...vendorQueries.products(), enabled: useVendorGate() });
}

export function useVendorOrders() {
  return useQuery({ ...vendorQueries.orders(), enabled: useVendorGate() });
}

export function useVendorCustomers() {
  return useQuery({ ...vendorQueries.customers(), enabled: useVendorGate() });
}

/**
 * Dashboard headline numbers. `/vendor/analytics` has the money and the open-returns count, but not
 * the "awaiting confirmation / shipment" queues or the fulfilment rate — those are counted off the
 * order list, which the dashboard needs loaded anyway.
 */
export function useSellerStats() {
  const enabled = useVendorGate();
  const analytics = useQuery({ ...vendorQueries.analytics(), enabled });
  const orders = useQuery({ ...vendorQueries.orders(), enabled });
  const store = useQuery({ ...vendorQueries.store(), enabled });

  const stats = useMemo<SellerStats | undefined>(() => {
    if (!analytics.data) return undefined;
    const rows = orders.data ?? [];
    const awaitingConfirmation = rows.filter((o) => o.status === "pending").length;
    const awaitingShipment = rows.filter((o) => o.status === "confirmed" || o.status === "preparing").length;
    const closed = rows.filter((o) => !isActive(o.status)).length;

    return {
      ...analytics.data,
      storeName: store.data?.storeName ?? "Your store",
      awaitingConfirmation,
      awaitingShipment,
      fulfilledPercent: rows.length ? Math.round((closed / rows.length) * 100) : 0,
    };
  }, [analytics.data, orders.data, store.data]);

  return {
    stats,
    isPending: analytics.isPending || orders.isPending,
    isError: analytics.isError,
    error: analytics.error,
    refetch: analytics.refetch,
  };
}

/** Invalidates everything a product write can affect, including the shopper-facing catalogue. */
function useVendorProductInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.vendorProducts });
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };
}

/**
 * Saves a product. This rewrites the whole record on the backend, so the full existing product has
 * to go in alongside the change — see `vendorService.updateProduct`.
 */
export function useSaveVendorProduct() {
  const invalidate = useVendorProductInvalidation();
  return useMutation({
    mutationFn: ({ product, changes }: { product: VendorProduct; changes: VendorProductUpdate }) =>
      vendorService.updateProduct(product, changes),
    onSuccess: invalidate,
  });
}

export function useCreateVendorProduct() {
  const invalidate = useVendorProductInvalidation();
  return useMutation({
    mutationFn: (input: VendorProductCreate) => vendorService.createProduct(input),
    onSuccess: invalidate,
  });
}

export function useSetVendorProductStock() {
  const invalidate = useVendorProductInvalidation();
  return useMutation({
    mutationFn: ({ productId, stock }: { productId: string; stock: number }) =>
      vendorService.setProductStock(productId, stock),
    onSuccess: invalidate,
  });
}

export function useSetVendorProductStatus() {
  const invalidate = useVendorProductInvalidation();
  return useMutation({
    mutationFn: ({ productId, status }: { productId: string; status: VendorProductStatus }) =>
      vendorService.setProductStatus(productId, status),
    onSuccess: invalidate,
  });
}

export function useDeleteVendorProduct() {
  const invalidate = useVendorProductInvalidation();
  return useMutation({
    mutationFn: (productId: string) => vendorService.deleteProduct(productId),
    onSuccess: invalidate,
  });
}

export function useSetVendorOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      vendorService.setOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorAnalytics });
    },
  });
}
