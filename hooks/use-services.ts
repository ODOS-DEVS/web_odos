"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bookingFlowService,
  bookingsService,
  servicesService,
  type ServiceListParams,
} from "@/services/services.service";
import { serviceQueries } from "@/services/queries";
import { useSession } from "./use-auth";
import type { BookingDraft, ServiceInput } from "@/types/services";

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

/* ---------- Bookings and quotations ---------- */

const bookingKeys = {
  provider: ["services", "bookings", "provider"] as const,
  mine: ["services", "bookings", "mine"] as const,
  providerQuotes: ["services", "quotations", "provider"] as const,
  myQuotes: ["services", "quotations", "mine"] as const,
};

export function useProviderBookings() {
  return useQuery({
    queryKey: bookingKeys.provider,
    queryFn: () => bookingsService.forProvider(),
    enabled: Boolean(useSession()),
    retry: false,
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.mine,
    queryFn: () => bookingsService.mine(),
    enabled: Boolean(useSession()),
    retry: false,
  });
}

export function useProviderQuotations() {
  return useQuery({
    queryKey: bookingKeys.providerQuotes,
    queryFn: () => bookingsService.quotationsForProvider(),
    enabled: Boolean(useSession()),
    retry: false,
  });
}

/** Moving a booking changes both queues and the provider's earnings, so both are invalidated. */
export function useTransitionBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string | null }) =>
      bookingsService.transition(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", "bookings"] });
      queryClient.invalidateQueries({ queryKey: ["vendor", "wallet"] });
    },
  });
}

export function useSendQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; amount: number; message?: string | null; durationMinutes?: number | null }) =>
      bookingsService.sendQuote(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services", "quotations"] }),
  });
}

/* ---------- Booking flow and escrow ---------- */

export function useServiceSlots(serviceId: string, day: string | null, draft: BookingDraft = {}) {
  return useQuery({
    queryKey: ["services", "slots", serviceId, day, draft.packageId ?? null, draft.hours ?? null] as const,
    queryFn: () => bookingFlowService.slots(serviceId, day!, draft),
    enabled: Boolean(serviceId && day),
    retry: false,
  });
}

/**
 * Live estimate for the configuration on screen. Advisory by design — the API reprices when the
 * booking is written, so this must never be presented as the amount charged.
 */
export function useBookingQuote(serviceId: string, draft: BookingDraft, enabled = true) {
  return useQuery({
    queryKey: ["services", "quote", serviceId, draft] as const,
    queryFn: () => bookingFlowService.quote(serviceId, draft),
    enabled: enabled && Boolean(serviceId),
    retry: false,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, draft }: { serviceId: string; draft: BookingDraft }) =>
      bookingFlowService.create(serviceId, draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services", "bookings"] }),
  });
}

export function useBookingCheckout() {
  return useMutation({ mutationFn: (bookingId: string) => bookingFlowService.checkout(bookingId) });
}

export function useVerifyBookingPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) => bookingFlowService.verifyPayment(reference),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services", "bookings"] }),
  });
}

/** The customer releasing escrow. Invalidates the hold as well as the booking lists. */
export function useConfirmWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingFlowService.confirmWork(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", "bookings"] });
      queryClient.invalidateQueries({ queryKey: ["services", "hold"] });
    },
  });
}

export function useBookingHold(bookingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["services", "hold", bookingId] as const,
    queryFn: () => bookingFlowService.hold(bookingId!),
    enabled: enabled && Boolean(bookingId),
    retry: false,
  });
}
