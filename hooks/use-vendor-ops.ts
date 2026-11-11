"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorOpsService } from "@/services/vendor-ops.service";
import { queryKeys } from "@/services/queries";
import type { VendorPayoutDetailsInput, VendorReturn, VendorReview, VendorVoucher, VendorVoucherInput } from "@/types/vendor";

/* ---------- Returns ---------- */

export function useVendorReturns() {
  return useQuery({ queryKey: queryKeys.vendorReturns, queryFn: () => vendorOpsService.returns() });
}

export function useUpdateVendorReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      vendorOpsService.updateReturn(id, { status, note }),
    onSuccess: (updated) => {
      queryClient.setQueryData<VendorReturn[]>(queryKeys.vendorReturns, (rows) =>
        rows?.map((row) => (row.id === updated.id ? updated : row)),
      );
      // Refunds move money, so the wallet is stale the moment one lands.
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorWallet });
    },
  });
}

/* ---------- Reviews ---------- */

export function useVendorReviews() {
  return useQuery({ queryKey: queryKeys.vendorReviews, queryFn: () => vendorOpsService.reviews() });
}

export function useReplyToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      vendorOpsService.replyToReview(reviewId, reply),
    onSuccess: (updated) => {
      queryClient.setQueryData<VendorReview[]>(queryKeys.vendorReviews, (rows) =>
        rows?.map((row) => (row.id === updated.id ? updated : row)),
      );
    },
  });
}

/* ---------- Vouchers ---------- */

export function useVendorVouchers() {
  return useQuery({ queryKey: queryKeys.vendorVouchers, queryFn: () => vendorOpsService.vouchers() });
}

function replaceVoucher(rows: VendorVoucher[] | undefined, updated: VendorVoucher) {
  return rows?.map((row) => (row.id === updated.id ? updated : row));
}

export function useSaveVendorVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: VendorVoucherInput }) =>
      id ? vendorOpsService.updateVoucher(id, input) : vendorOpsService.createVoucher(input),
    onSuccess: (saved, { id }) => {
      queryClient.setQueryData<VendorVoucher[]>(queryKeys.vendorVouchers, (rows) =>
        id ? replaceVoucher(rows, saved) : [saved, ...(rows ?? [])],
      );
    },
  });
}

export function useGiftVendorVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email, note }: { id: string; email: string; note?: string }) =>
      vendorOpsService.giftVoucher(id, email, note),
    onSuccess: (updated) => {
      queryClient.setQueryData<VendorVoucher[]>(queryKeys.vendorVouchers, (rows) => replaceVoucher(rows, updated));
    },
  });
}

export function useDeleteVendorVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorOpsService.deleteVoucher(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<VendorVoucher[]>(queryKeys.vendorVouchers, (rows) => rows?.filter((row) => row.id !== id));
    },
  });
}

/* ---------- Wallet ---------- */

export function useVendorWallet() {
  return useQuery({ queryKey: queryKeys.vendorWallet, queryFn: () => vendorOpsService.wallet() });
}

export function useVendorPayoutInstitutions(methodType: "mobile_money" | "bank_transfer") {
  return useQuery({
    queryKey: queryKeys.vendorPayoutInstitutions(methodType),
    queryFn: () => vendorOpsService.payoutInstitutions(methodType),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSaveVendorPayoutDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorPayoutDetailsInput) => vendorOpsService.savePayoutDetails(input),
    onSuccess: (wallet) => queryClient.setQueryData(queryKeys.vendorWallet, wallet),
  });
}

export function useRequestVendorWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, note }: { amount: number; note?: string }) =>
      vendorOpsService.requestWithdrawal(amount, note),
    // The response is just the new request row; the balances moved too, so refetch the lot.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendorWallet }),
  });
}

/* ---------- Stock context ---------- */

export function useVendorPerformance(days = 30) {
  return useQuery({
    queryKey: queryKeys.vendorPerformance(days),
    queryFn: () => vendorOpsService.productPerformance(days),
    staleTime: 60 * 1000,
  });
}

export function useVendorMovements(limit = 40) {
  return useQuery({
    queryKey: queryKeys.vendorMovements,
    queryFn: () => vendorOpsService.inventoryMovements(limit),
  });
}
