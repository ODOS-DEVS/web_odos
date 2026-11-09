"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { courierService } from "@/services/courier.service";
import type { DeliveryStep } from "@/types/courier";
import { useSession } from "./use-auth";

const keys = {
  me: ["courier", "me"] as const,
  pool: ["courier", "pool"] as const,
  active: ["courier", "active"] as const,
  history: ["courier", "history"] as const,
  detail: (id: string) => ["courier", "delivery", id] as const,
};

export function useCourierProfile() {
  const session = useSession();
  return useQuery({ queryKey: keys.me, queryFn: () => courierService.me(), enabled: Boolean(session) });
}

export function useCreateCourierProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: courierService.createProfile,
    onSuccess: (profile) => queryClient.setQueryData(keys.me, profile),
  });
}

export function useCourierOnline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (online: boolean) => courierService.setOnline(online),
    onSuccess: (profile) => {
      queryClient.setQueryData(keys.me, profile);
      queryClient.invalidateQueries({ queryKey: keys.pool });
    },
  });
}

/** The job in progress; polled so vendor/customer confirmations show up without a refresh. */
export function useActiveDelivery(enabled: boolean) {
  return useQuery({ queryKey: keys.active, queryFn: () => courierService.active(), enabled, refetchInterval: 10_000 });
}

/** Open jobs, polled while the courier is online and free. */
export function useDeliveryPool(enabled: boolean) {
  return useQuery({ queryKey: keys.pool, queryFn: () => courierService.pool(), enabled, refetchInterval: 15_000 });
}

export function useDeliveryHistory(enabled: boolean) {
  return useQuery({ queryKey: keys.history, queryFn: () => courierService.history(), enabled });
}

export function useDeliveryDetail(id: string | undefined) {
  return useQuery({
    queryKey: keys.detail(id ?? ""),
    queryFn: () => courierService.detail(id!),
    enabled: Boolean(id),
    refetchInterval: 10_000,
  });
}

export function useClaimOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => courierService.claim(offerId),
    onSuccess: (delivery) => {
      queryClient.setQueryData(keys.active, delivery);
      queryClient.invalidateQueries({ queryKey: keys.pool });
    },
  });
}

export function useDeliveryStep(deliveryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ step, reason, note }: { step: DeliveryStep; reason?: string; note?: string }) =>
      courierService.step(deliveryId, step, { reason, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.active });
      queryClient.invalidateQueries({ queryKey: keys.detail(deliveryId) });
      queryClient.invalidateQueries({ queryKey: keys.history });
      queryClient.invalidateQueries({ queryKey: keys.pool });
    },
  });
}

/**
 * While online, shares the browser's location (PATCH /courier/location) at most every 30 seconds.
 * Does nothing when the shopper denies location access.
 */
export function useLocationSharing(online: boolean) {
  const lastSent = useRef(0);
  useEffect(() => {
    if (!online || typeof navigator === "undefined" || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const now = Date.now();
        if (now - lastSent.current < 30_000) return;
        lastSent.current = now;
        void courierService.updateLocation(coords.latitude, coords.longitude).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [online]);
}
