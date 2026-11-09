"use client";

import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useReviewEligibility, useSubmitReview } from "@/hooks/use-product-extras";
import { cn } from "@/libs/cn";

/**
 * "Write a review" for shoppers who received this product. Reviews are tied to an order, so guests and
 * shoppers who haven't bought it see nothing. Submitting again updates the existing review.
 */
export function WriteReview({ productId }: { productId: string }) {
  const { signedIn, isLoading, orderId, existing } = useReviewEligibility(productId);
  const [open, setOpen] = useState(false);

  if (!signedIn || isLoading || !orderId) return null;

  if (!open) {
    return (
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {existing ? "Edit your review" : "Write a review"}
        </Button>
      </div>
    );
  }

  return (
    <ReviewForm
      key={existing?.id ?? "new"}
      productId={productId}
      orderId={orderId}
      initialRating={existing?.rating ?? 0}
      initialComment={existing?.comment ?? ""}
      onDone={() => setOpen(false)}
    />
  );
}

function ReviewForm({
  productId,
  orderId,
  initialRating,
  initialComment,
  onDone,
}: {
  productId: string;
  orderId: string;
  initialRating: number;
  initialComment: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const submit = useSubmitReview(productId);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating < 1 || !comment.trim()) return;
    submit.mutate(
      { orderId, rating, comment: comment.trim() },
      {
        onSuccess: () => {
          toast.success("Thanks — your review is posted");
          onDone();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-2xl border border-line bg-surface p-5">
      <fieldset>
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              className="press grid size-10 place-items-center rounded-full hover:bg-surface-muted"
            >
              <Star className={cn("size-6", value <= rating ? "fill-current text-warning" : "text-line")} aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>

      <label htmlFor="review-comment" className="mt-4 block text-sm font-medium">
        Your review
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="What did you like or dislike?"
        className="mt-1.5 w-full rounded-xl border border-line bg-surface p-3 text-base outline-none focus:border-foreground sm:text-sm"
      />

      <div className="mt-4 flex gap-2">
        <Button type="submit" size="sm" disabled={submit.isPending || rating < 1 || !comment.trim()}>
          {submit.isPending ? "Posting…" : "Post review"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
