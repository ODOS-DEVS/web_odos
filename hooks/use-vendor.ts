"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorService, type VendorProductCreate, type VendorProductUpdate } from "@/services/vendor.service";
import { queryKeys, vendorQueries } from "@/services/queries";
import type { VendorStatus } from "@/types/api";
import type {
  VendorAnalyticsPeriod,
  VendorCancelReason,
  VendorOrderStatus,
  VendorProduct,
  VendorProductSelfServiceStatus,
} from "@/types/vendor";
import { useSession } from "./use-auth";

/**
 * Vendor standing for the signed-in user.
 *
 * Only `approved` opens the seller workspace — the mobile app turns `pending`, `under_review`,
 * `rejected` and `suspended` away from those screens, so the website must not offer tabs the phone
 * would refuse. Reads the session rather than firing a request: `vendor_status` rides on the user.
 */
export function useVendorStatus(): { status: VendorStatus; isVendor: boolean; hasApplied: boolean } {
  const user = useSession()?.user;
  const status: VendorStatus = user?.vendor_status ?? "none";
  return { status, isVendor: status === "approved", hasApplied: status !== "none" };
}

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

/** Whole-business counters, computed server-side rather than off a page of orders. */
export function useVendorDashboard() {
  return useQuery({ ...vendorQueries.dashboard(), enabled: useVendorGate() });
}

export function useVendorAnalytics(period: VendorAnalyticsPeriod = "30d") {
  return useQuery({ ...vendorQueries.analytics(period), enabled: useVendorGate() });
}

/** Invalidates everything a product write can affect, including the shopper-facing catalogue. */
function useVendorProductInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.vendorProducts });
    queryClient.invalidateQueries({ queryKey: queryKeys.vendorDashboard });
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
    mutationFn: ({ productId, status }: { productId: string; status: VendorProductSelfServiceStatus }) =>
      vendorService.setProductStatus(productId, status),
    onSuccess: invalidate,
  });
}

/** Stock or visibility across a selection. JSON and narrow — no whole-record gallery risk. */
export function useBulkUpdateVendorProducts() {
  const invalidate = useVendorProductInvalidation();
  return useMutation({
    mutationFn: (input: { productIds: string[]; stock?: number; status?: VendorProductSelfServiceStatus }) =>
      vendorService.bulkUpdateProducts(input),
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

/**
 * Advances (or cancels) this vendor's package.
 *
 * The API accepts only an exact single step forward, plus `cancelled` from pending/confirmed, so
 * callers derive the target with `getVendorOrderNextStatus` rather than naming a status directly.
 */
export function useAdvanceVendorOrder() {
  return useSetVendorOrderStatus();
}

function useVendorOrderInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.vendorOrders });
    queryClient.invalidateQueries({ queryKey: queryKeys.vendorDashboard });
  };
}

/** Proof-of-handover photo, shown to the customer alongside the delivery. */
export function useUploadDispatchPhoto() {
  const invalidate = useVendorOrderInvalidation();
  return useMutation({
    mutationFn: ({ orderId, photo }: { orderId: string; photo: File }) =>
      vendorService.uploadDispatchPhoto(orderId, photo),
    onSuccess: invalidate,
  });
}

export function useNotifyDeparture() {
  const invalidate = useVendorOrderInvalidation();
  return useMutation({
    mutationFn: (orderId: string) => vendorService.notifyDeparture(orderId),
    onSuccess: invalidate,
  });
}

/** Opt-in per order: hands this delivery to an ODOS rider instead of the vendor's own. */
export function useRequestCourier() {
  const invalidate = useVendorOrderInvalidation();
  return useMutation({
    mutationFn: (orderId: string) => vendorService.requestCourier(orderId),
    onSuccess: invalidate,
  });
}

export function useAcknowledgeVendorOrder() {
  const invalidate = useVendorOrderInvalidation();
  return useMutation({
    mutationFn: (orderId: string) => vendorService.acknowledgeOrder(orderId),
    onSuccess: invalidate,
  });
}

/**
 * Withdraws this vendor's package from an order, with a reason.
 *
 * Separate from `useSetVendorOrderStatus`: this route carries the reason code
 * the shopper is shown, and it is the one that opens the refund.
 */
export function useCancelVendorOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reasonCode, note }: { orderId: string; reasonCode: VendorCancelReason; note?: string | null }) =>
      vendorService.cancelOrder(orderId, reasonCode, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorOrders });
      queryClient.invalidateQueries({ queryKey: ["vendor", "analytics"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorDashboard });
      // Stock comes back on a cancel, so the product list is stale too.
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorProducts });
    },
  });
}

/**
 * Answers a held cancellation request on one of this vendor's orders.
 *
 * Invalidates the same branches as a status change: approving it ends the order,
 * which moves the dashboard counters and the earnings figures too.
 */
export function useDecideVendorCancellation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, approve, note }: { orderId: string; approve: boolean; note?: string | null }) =>
      vendorService.decideCancellation(orderId, approve, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorOrders });
      queryClient.invalidateQueries({ queryKey: ["vendor", "analytics"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorDashboard });
    },
  });
}

export function useSetVendorOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: VendorOrderStatus }) =>
      vendorService.setOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorOrders });
      // Analytics is keyed per period, so invalidate the whole branch, not one window.
      queryClient.invalidateQueries({ queryKey: ["vendor", "analytics"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorDashboard });
    },
  });
}

/**
 * Where "Seller Centre" should send someone, by their vendor standing.
 *
 * One place, because this link exists in the header menu, the account page and the vendor tab,
 * and they had drifted: two of them pointed at `/account?tab=dashboard`, a tab that no longer
 * exists, so an approved vendor landed on their shopper profile instead of their dashboard.
 *
 * `/seller` itself re-checks standing (see `VendorShell`), so this is about sending people
 * somewhere useful rather than about access control.
 */
export function sellerCenterTarget(status: VendorStatus): { href: string; label: string } {
  switch (status) {
    case "approved":
      return { href: "/seller", label: "Seller Centre" };
    case "pending":
    case "under_review":
      // Their application is in flight; the account tab is where its progress is reported.
      return { href: "/account?tab=vendor", label: "Application status" };
    case "rejected":
    case "suspended":
      return { href: "/account?tab=vendor", label: "Vendor account" };
    default:
      return { href: "/account?tab=vendor&apply=1", label: "Become a Vendor" };
  }
}

/** The signed-in user's own Seller Centre destination. */
export function useSellerCenterTarget() {
  return sellerCenterTarget(useVendorStatus().status);
}
