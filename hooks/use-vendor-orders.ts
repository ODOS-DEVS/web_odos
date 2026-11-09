"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorOrdersService, type VendorOrder } from "@/services/vendor-orders.service";
import type { FulfilmentStatus } from "@/types/order";

export type { VendorOrder };
import { useSession } from "./use-auth";

export function useVendorOrders() {
  const session = useSession();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["vendor", "orders"],
    queryFn: () => vendorOrdersService.list(),
    enabled: Boolean(session),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FulfilmentStatus }) =>
      vendorOrdersService.advanceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor", "dashboard"] });
    },
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    advanceAsync: (id: string, status: FulfilmentStatus) => mutation.mutateAsync({ id, status }),
    isAdvancing: mutation.isPending,
  };
}

