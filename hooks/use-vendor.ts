"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/services/vendor.service";
import { useSession } from "./use-auth";

export const vendorKeys = {
  all: ["vendor"] as const,
  profile: () => [...vendorKeys.all, "profile"] as const,
  dashboard: () => [...vendorKeys.all, "dashboard"] as const,
  analytics: (period?: string) => [...vendorKeys.all, "analytics", period] as const,
  store: () => [...vendorKeys.all, "store"] as const,
  sections: () => [...vendorKeys.all, "sections"] as const,
  sectionProducts: (id: string) => [...vendorKeys.all, "sections", id, "products"] as const,
  customers: (q?: string) => [...vendorKeys.all, "customers", q] as const,
  reviews: (q?: string) => [...vendorKeys.all, "reviews", q] as const,
  returns: () => [...vendorKeys.all, "returns"] as const,
  returnDetail: (id: string) => [...vendorKeys.all, "returns", id] as const,
  wallet: () => [...vendorKeys.all, "wallet"] as const,
  payoutInstitutions: (type: string) => [...vendorKeys.all, "payout-institutions", type] as const,
  deliverySettings: () => [...vendorKeys.all, "delivery-settings"] as const,
  vouchers: () => [...vendorKeys.all, "vouchers"] as const,
  inventoryStats: () => [...vendorKeys.all, "inventory", "stats"] as const,
  lowStock: () => [...vendorKeys.all, "inventory", "low-stock"] as const,
};

export function useVendorDashboard() {
  const session = useSession();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  return useQuery({
    queryKey: vendorKeys.dashboard(),
    queryFn: () => vendorService.getDashboard(),
    enabled: Boolean(session && isVendor),
    staleTime: 15_000,
  });
}

export function useVendorProfile() {
  const session = useSession();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  return useQuery({
    queryKey: vendorKeys.profile(),
    queryFn: () => vendorService.getProfile(),
    enabled: Boolean(session && isVendor),
    staleTime: 30_000,
  });
}

export function useVendorStore() {
  const session = useSession();
  const queryClient = useQueryClient();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  const storeQuery = useQuery({
    queryKey: vendorKeys.store(),
    queryFn: () => vendorService.getStore(),
    enabled: Boolean(session && isVendor),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (input: Parameters<typeof vendorService.patchStore>[0]) => vendorService.patchStore(input),
    onSuccess: (data) => {
      queryClient.setQueryData(vendorKeys.store(), data);
      queryClient.invalidateQueries({ queryKey: vendorKeys.store() });
    },
  });

  return {
    store: storeQuery.data ?? null,
    isLoading: storeQuery.isLoading,
    refetch: storeQuery.refetch,
    updateStore: updateMutation.mutate,
    updateStoreAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

export function useVendorSections() {
  const session = useSession();
  const queryClient = useQueryClient();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  const sectionsQuery = useQuery({
    queryKey: vendorKeys.sections(),
    queryFn: () => vendorService.getSections(),
    enabled: Boolean(session && isVendor),
    staleTime: 20_000,
  });

  const createMutation = useMutation({
    mutationFn: (input: { title: string; description?: string }) => vendorService.createSection(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.sections() }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => vendorService.patchSection(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.sections() }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorService.deleteSection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.sections() }),
  });

  return {
    sections: sectionsQuery.data ?? [],
    isLoading: sectionsQuery.isLoading,
    createSection: createMutation.mutateAsync,
    updateSection: updateMutation.mutateAsync,
    deleteSection: deleteMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}

export function useVendorCustomers(query?: string) {
  const session = useSession();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  return useQuery({
    queryKey: vendorKeys.customers(query),
    queryFn: () => vendorService.getCustomers(query),
    enabled: Boolean(session && isVendor),
    staleTime: 20_000,
  });
}

export function useVendorReviews(query?: string) {
  const session = useSession();
  const queryClient = useQueryClient();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  const reviewsQuery = useQuery({
    queryKey: vendorKeys.reviews(query),
    queryFn: () => vendorService.getReviews(query),
    enabled: Boolean(session && isVendor),
    staleTime: 20_000,
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      vendorService.replyReview(reviewId, reply),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.reviews() }),
  });

  return {
    reviews: reviewsQuery.data ?? [],
    isLoading: reviewsQuery.isLoading,
    replyReview: replyMutation.mutateAsync,
    isReplying: replyMutation.isPending,
  };
}

export function useVendorReturns() {
  const session = useSession();
  const queryClient = useQueryClient();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  const returnsQuery = useQuery({
    queryKey: vendorKeys.returns(),
    queryFn: () => vendorService.getReturns(),
    enabled: Boolean(session && isVendor),
    staleTime: 20_000,
  });

  const patchMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { status?: string; admin_note?: string; refund_amount?: number };
    }) => vendorService.patchReturn(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.returns() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.dashboard() });
    },
  });

  return {
    returns: returnsQuery.data ?? [],
    isLoading: returnsQuery.isLoading,
    patchReturn: patchMutation.mutateAsync,
    isPatching: patchMutation.isPending,
  };
}

export function useVendorWallet() {
  const session = useSession();
  const queryClient = useQueryClient();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  const walletQuery = useQuery({
    queryKey: vendorKeys.wallet(),
    queryFn: () => vendorService.getWallet(),
    enabled: Boolean(session && isVendor),
    staleTime: 20_000,
  });

  const withdrawalMutation = useMutation({
    mutationFn: (amount: number) => vendorService.requestWithdrawal(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.wallet() });
    },
  });

  const payoutDetailsMutation = useMutation({
    mutationFn: (input: Parameters<typeof vendorService.patchPayoutDetails>[0]) =>
      vendorService.patchPayoutDetails(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.wallet() });
    },
  });

  return {
    wallet: walletQuery.data ?? null,
    isLoading: walletQuery.isLoading,
    requestWithdrawal: withdrawalMutation.mutateAsync,
    isWithdrawing: withdrawalMutation.isPending,
    updatePayoutDetails: payoutDetailsMutation.mutateAsync,
    isUpdatingPayout: payoutDetailsMutation.isPending,
  };
}

export function useVendorVouchers() {
  const session = useSession();
  const queryClient = useQueryClient();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  const vouchersQuery = useQuery({
    queryKey: vendorKeys.vouchers(),
    queryFn: () => vendorService.getVouchers(),
    enabled: Boolean(session && isVendor),
    staleTime: 20_000,
  });

  const createMutation = useMutation({
    mutationFn: (input: any) => vendorService.createVoucher(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.vouchers() }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorService.deleteVoucher(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.vouchers() }),
  });

  const giftMutation = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => vendorService.giftVoucher(id, email),
  });

  return {
    vouchers: vouchersQuery.data ?? [],
    isLoading: vouchersQuery.isLoading,
    createVoucher: createMutation.mutateAsync,
    deleteVoucher: deleteMutation.mutateAsync,
    giftVoucher: giftMutation.mutateAsync,
    isMutating: createMutation.isPending || deleteMutation.isPending || giftMutation.isPending,
  };
}

export function useVendorInventoryStats() {
  const session = useSession();
  const isVendor = session?.user.role === "vendor" || session?.user.vendor_status === "approved";

  const statsQuery = useQuery({
    queryKey: vendorKeys.inventoryStats(),
    queryFn: () => vendorService.getInventoryStats(),
    enabled: Boolean(session && isVendor),
    staleTime: 20_000,
  });

  const lowStockQuery = useQuery({
    queryKey: vendorKeys.lowStock(),
    queryFn: () => vendorService.getLowStockAlerts(),
    enabled: Boolean(session && isVendor),
    staleTime: 20_000,
  });

  return {
    stats: statsQuery.data ?? null,
    lowStock: lowStockQuery.data ?? [],
    isLoading: statsQuery.isLoading || lowStockQuery.isLoading,
  };
}

