"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { queryKeys, reviewQueries } from "@/services/queries";
import { reviewsService, type MyProductReview } from "@/services/reviews.service";
import { useMounted } from "./use-mounted";

export type { MyProductReview };

type SubmitInput = {
  orderId: string;
  productId: string;
  rating: number;
  comment: string;
};

type LocalMyReviewsState = {
  reviews: MyProductReview[];
  saveLocal: (input: SubmitInput) => MyProductReview;
};

const useLocalMyReviewsStore = create<LocalMyReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],
      saveLocal: (input) => {
        const existing = get().reviews.find(
          (r) => r.productId === input.productId && r.orderId === input.orderId,
        );
        const review: MyProductReview = {
          ...input,
          id: existing?.id ?? crypto.randomUUID(),
          updatedAt: new Date().toISOString(),
        };
        set({
          reviews: [
            review,
            ...get().reviews.filter(
              (r) => !(r.productId === input.productId && r.orderId === input.orderId),
            ),
          ],
        });
        return review;
      },
    }),
    { name: "odos-my-reviews-v1" },
  ),
);

/**
 * Connected to GET /reviews/me and POST /reviews with React Query caching,
 * live invalidation, and fallback.
 */
export function useMyReviews() {
  const ready = useMounted();
  const queryClient = useQueryClient();

  const localReviews = useLocalMyReviewsStore((s) => s.reviews);
  const saveLocal = useLocalMyReviewsStore((s) => s.saveLocal);

  const query = useQuery({
    ...reviewQueries.mine(),
    enabled: ready,
    retry: 1,
  });

  const submitMutation = useMutation({
    mutationFn: async (input: SubmitInput) => {
      try {
        return await reviewsService.upsert(input);
      } catch {
        return saveLocal(input);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myReviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(variables.productId) });
    },
  });

  const reviews = useMemo(() => {
    if (!ready) return [];
    if (query.data && query.data.length > 0) return query.data;
    return localReviews;
  }, [ready, query.data, localReviews]);

  return {
    ready,
    isLoading: query.isLoading,
    reviews,
    submit: (input: SubmitInput) => submitMutation.mutate(input),
    submitAsync: (input: SubmitInput) => submitMutation.mutateAsync(input),
    isSubmitting: submitMutation.isPending,
  };
}

/** The shopper's own review for a given product/order, if any. */
export function useMyReviewForItem(productId: string, orderId?: string) {
  const { reviews, ready } = useMyReviews();
  return useMemo(() => {
    if (!ready) return undefined;
    return reviews.find(
      (r) => r.productId === productId && (!orderId || r.orderId === orderId),
    );
  }, [reviews, productId, orderId, ready]);
}
