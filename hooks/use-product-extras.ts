"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewsService } from "@/services/reviews.service";
import { vouchersService } from "@/services/vouchers.service";
import { queryKeys, reviewQueries, voucherQueries } from "@/services/queries";
import { useSession } from "./use-auth";
import { useOrders } from "./use-orders";

/** Vouchers the product's store is offering. Re-fetched per session so `claimed` matches the shopper. */
export function useStoreVouchers(storeId: string | null | undefined) {
  const viewer = useSession()?.user.id ?? null;
  return useQuery({ ...voucherQueries.forStore(storeId ?? "", viewer), enabled: Boolean(storeId) });
}

/** Platform promotions for the home page. */
export function usePromotions() {
  const viewer = useSession()?.user.id ?? null;
  return useQuery(voucherQueries.promotions(viewer));
}

export function useClaimVoucher(storeId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (voucherId: string) => vouchersService.claim(voucherId),
    // Prefix match: refreshes this store's vouchers for every viewer key.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeId ? ["vouchers", "store", storeId] : ["vouchers", "promotions"] });
      queryClient.invalidateQueries({ queryKey: ["vouchers", "mine"] });
    },
  });
}

/**
 * Whether the signed-in shopper may review this product, and their existing review if any. Reviews are
 * tied to an order, so it looks for a delivered package containing the product.
 */
export function useReviewEligibility(productId: string) {
  const session = useSession();
  const orders = useOrders();
  const mine = useQuery({ ...reviewQueries.mine(), enabled: Boolean(session) });

  return useMemo(() => {
    const existing = mine.data?.find((r) => r.productId === productId) ?? null;
    const order = orders.data?.find((o) =>
      o.packages.some((p) => p.status === "delivered" && p.items.some((i) => i.productId === productId)),
    );
    return {
      signedIn: Boolean(session),
      isLoading: Boolean(session) && (orders.isPending || mine.isPending),
      orderId: existing?.orderId ?? order?.id ?? null,
      existing,
    };
  }, [session, orders.data, orders.isPending, mine.data, mine.isPending, productId]);
}

export function useSubmitReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { orderId: string; rating: number; comment: string }) =>
      reviewsService.upsert({ ...input, productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myReviews });
    },
  });
}
