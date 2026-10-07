"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMounted } from "./use-mounted";

export type MyReview = {
  id: string;
  orderItemId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type SubmitInput = { orderItemId: string; productId: string; rating: number; comment: string };

type MyReviewsState = {
  reviews: MyReview[];
  submit: (input: SubmitInput) => void;
};

// No reviews endpoint wired up yet, so the shopper's own reviews live in the browser like returns.
const useMyReviewsStore = create<MyReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],
      submit: (input) => {
        const existing = get().reviews.find((r) => r.orderItemId === input.orderItemId);
        const review: MyReview = { ...input, id: existing?.id ?? crypto.randomUUID(), createdAt: new Date().toISOString() };
        set({ reviews: [review, ...get().reviews.filter((r) => r.orderItemId !== input.orderItemId)] });
      },
    }),
    { name: "odos-my-reviews-v1" },
  ),
);

/** The shopper's own submitted product reviews. `ready` is false until the client has mounted. */
export function useMyReviews() {
  const ready = useMounted();
  const stored = useMyReviewsStore((s) => s.reviews);
  const submit = useMyReviewsStore((s) => s.submit);
  const reviews = useMemo(() => (ready ? stored : []), [ready, stored]);
  return { ready, reviews, submit };
}

/** The shopper's own review for a given order item, if any. */
export function useMyReviewForItem(orderItemId: string) {
  const ready = useMounted();
  const review = useMyReviewsStore((s) => s.reviews.find((r) => r.orderItemId === orderItemId));
  return ready ? review : undefined;
}
