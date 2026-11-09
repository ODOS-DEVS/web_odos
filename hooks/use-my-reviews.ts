"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewsService, type ReviewInput } from "@/services/reviews.service";
import { queryKeys, reviewQueries } from "@/services/queries";
import type { MyReview } from "@/types/review";
import { useSession } from "./use-auth";

export type { MyReview };

/** The shopper's own submitted reviews, and the mutation that writes one. */
export function useMyReviews() {
  const session = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({ ...reviewQueries.mine(), enabled: Boolean(session) });

  const submit = useMutation({
    mutationFn: (input: ReviewInput) => reviewsService.upsert(input),
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myReviews });
      // The product's own review list and its rating change too.
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(input.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.product(input.productId) });
    },
  });

  return {
    ready: Boolean(session) && query.isSuccess,
    reviews: query.data ?? [],
    isPending: query.isPending,
    submit,
  };
}

/** The shopper's review of one product on one order, if they have written it. */
export function useMyReviewForItem(orderId: string, productId: string): MyReview | undefined {
  const { reviews } = useMyReviews();
  return reviews.find((r) => r.orderId === orderId && r.productId === productId);
}
