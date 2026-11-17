"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedQueries, queryKeys } from "@/services/queries";
import { behaviorService, type BehaviorEvent } from "@/services/behavior.service";
import { useSession } from "./use-auth";

/** Personalised home sections. Public, so it loads for signed-out shoppers too. */
export function useHomeFeed() {
  return useQuery(feedQueries.home());
}

export function useFeedSection(key: string, enabled = true) {
  return useQuery({ ...feedQueries.section(key), enabled });
}

export function useRecordBehavior() {
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (events: BehaviorEvent[]) => behaviorService.record(events),
    onSuccess: () => {
      // A recorded view changes what `recently_viewed` and `recommended` should contain.
      if (session) queryClient.invalidateQueries({ queryKey: queryKeys.homeFeed });
    },
  });
}

/**
 * Records one product view, once per mount.
 *
 * Guarded by a ref rather than a dependency list because React may re-run effects (Strict Mode
 * double-invoke, a re-render with a new object identity) and a view counted twice skews the
 * recommendation signal. Signed-out shoppers are skipped: the API attributes events to a user,
 * so there is nothing to attribute.
 */
export function useRecordProductView(productId: string | undefined, category?: string | null) {
  const session = useSession();
  const record = useRecordBehavior();
  const recorded = useRef<string | null>(null);

  useEffect(() => {
    if (!productId || !session) return;
    if (recorded.current === productId) return;
    recorded.current = productId;
    record.mutate([{ eventType: "product_view", productId, category: category ?? null }]);
    // `record` is a stable mutation object; re-running on it would defeat the guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, session, category]);
}
