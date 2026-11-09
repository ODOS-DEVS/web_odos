"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { segmentationService } from "@/services/segmentation.service";
import { useSession } from "./use-auth";

const KEY = ["segmentation"] as const;

export function useSegmentOverview() {
  const session = useSession();
  return useQuery({ queryKey: [...KEY, "overview"], queryFn: () => segmentationService.overview(), enabled: Boolean(session), retry: false });
}

export function useChurnRisk(threshold: number, limit = 100) {
  const session = useSession();
  return useQuery({
    queryKey: [...KEY, "churn", threshold, limit],
    queryFn: () => segmentationService.churnRisk(threshold, limit),
    enabled: Boolean(session),
    retry: false,
  });
}

export function useSegmentMembers(segment: string | null, limit = 100) {
  return useQuery({
    queryKey: [...KEY, "members", segment, limit],
    queryFn: () => segmentationService.members(segment!, limit),
    enabled: Boolean(segment),
    retry: false,
  });
}

export function useSegmentStats(segment: string | null) {
  return useQuery({
    queryKey: [...KEY, "stats", segment],
    queryFn: () => segmentationService.stats(segment!),
    enabled: Boolean(segment),
    retry: false,
  });
}

export function useCustomerProfile(userId: string | null) {
  return useQuery({
    queryKey: [...KEY, "user", userId],
    queryFn: () => segmentationService.user(userId!),
    enabled: Boolean(userId?.trim()),
    retry: false,
  });
}

/** Fetches a segment's export rows (on demand — it's a download, not a view). */
export function useExportSegment() {
  return useMutation({ mutationFn: (segment: string) => segmentationService.export(segment) });
}
