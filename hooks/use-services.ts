"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { servicesService, type ServiceListParams } from "@/services/services.service";
import { serviceQueries } from "@/services/queries";
import { useSession } from "./use-auth";
import type { ServiceInput } from "@/types/services";

const keys = {
  detail: (id: string) => ["services", "detail", id] as const,
  mine: ["services", "mine"] as const,
};

/**
 * The service marketplace is not deployed yet, so every one of these can 404 in production.
 * `retry: false` keeps a missing endpoint from costing three round trips before the UI can say
 * so, and the pages treat an error as "services aren't available here" rather than a crash.
 */
export function useServiceCategories() {
  return useQuery(serviceQueries.categories());
}

export function useServices(params: ServiceListParams = {}) {
  return useQuery(serviceQueries.list(params));
}

export function useService(serviceId: string) {
  return useQuery({
    queryKey: keys.detail(serviceId),
    queryFn: () => servicesService.detail(serviceId),
    enabled: Boolean(serviceId),
    retry: false,
  });
}

/* ---------- Provider side ---------- */

export function useMyServices() {
  return useQuery({
    queryKey: keys.mine,
    queryFn: () => servicesService.mine(),
    enabled: Boolean(useSession()),
    retry: false,
  });
}

function useServiceInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.mine });
    // A published listing changes what shoppers can find.
    queryClient.invalidateQueries({ queryKey: ["services", "list"] });
  };
}

export function useCreateService() {
  const invalidate = useServiceInvalidation();
  return useMutation({ mutationFn: (input: ServiceInput) => servicesService.create(input), onSuccess: invalidate });
}

export function useUpdateService() {
  const invalidate = useServiceInvalidation();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<ServiceInput>) => servicesService.update(id, input),
    onSuccess: invalidate,
  });
}

export function useSetServiceStatus() {
  const invalidate = useServiceInvalidation();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => servicesService.setStatus(id, status),
    onSuccess: invalidate,
  });
}
