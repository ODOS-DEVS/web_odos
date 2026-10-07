"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Star, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
import { useMyReviewForItem, useMyReviews } from "@/hooks/use-my-reviews";
import { cn } from "@/libs/cn";
import { formatDate } from "@/libs/format";
import { MOCK_ORDERS } from "@/mocks/orders.mock";

type ReviewableItem = {
  orderItemId: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  orderNumber: string;
  deliveredAt: string;
};

function reviewableItems(): ReviewableItem[] {
  const items: ReviewableItem[] = [];
  for (const order of MOCK_ORDERS) {
    for (const pkg of order.packages) {
      if (pkg.status !== "delivered") continue;
      const deliveredAt = order.timeline.find((t) => t.label === "Delivered")?.at ?? order.placedAt;
      for (const item of pkg.items) {
        items.push({ orderItemId: item.id, productId: item.productId, name: item.name, imageUrl: item.imageUrl, orderNumber: order.number, deliveredAt });
      }
    }
  }
  return items;
}

function StarPicker({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={filled}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            onClick={() => onChange(starValue)}
            className="press p-0.5 text-warning"
          >
            <Star className={cn("size-7", filled ? "fill-current" : "text-line")} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 text-warning" role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("size-4", i < value ? "fill-current" : "text-line")} aria-hidden />
      ))}
    </div>
  );
}

function ReviewForm({ item, initial, onCancel, onDone }: { item: ReviewableItem; initial?: { rating: number; comment: string }; onCancel: () => void; onDone: () => void }) {
  const { submit } = useMyReviews();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating === 0) return;
    submit({ orderItemId: item.orderItemId, productId: item.productId, rating, comment: comment.trim() });
    toast.success("Review submitted");
    onDone();
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4 border-t border-line pt-4">
      <div>
        <p className="mb-1.5 text-sm font-medium">Your rating</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div>
        <label htmlFor={`comment-${item.orderItemId}`} className="mb-1.5 block text-sm font-medium">
          Your review
        </label>
        <textarea
          id={`comment-${item.orderItemId}`}
          rows={3}
          placeholder="What did you think of this item?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={cn(inputClass, "h-auto min-h-24 resize-none py-3")}
        />
      </div>
      <div className="flex gap-2.5">
        <Button type="submit" variant="accent" disabled={rating === 0}>
          Submit review
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReviewableItemRow({ item }: { item: ReviewableItem }) {
  const review = useMyReviewForItem(item.orderItemId);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Media src={item.imageUrl} name={item.name} sizes="48px" className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.name}</p>
          <p className="truncate text-xs text-muted">
            Order {item.orderNumber} · Delivered {formatDate(item.deliveredAt)}
          </p>
        </div>
        {!review && !open && (
          <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setOpen(true)}>
            Rate & review
          </Button>
        )}
      </div>

      {review && !open && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3">
            <Stars value={review.rating} />
            <button type="button" onClick={() => setOpen(true)} className="press flex items-center gap-1 text-xs font-medium text-accent hover:opacity-80">
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </button>
          </div>
          {review.comment && <p className="mt-2 text-sm text-muted">{review.comment}</p>}
        </div>
      )}

      {open && (
        <ReviewForm
          item={item}
          initial={review ? { rating: review.rating, comment: review.comment } : undefined}
          onCancel={() => setOpen(false)}
          onDone={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function ReviewsTab() {
  const items = reviewableItems();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Star className="size-6 text-muted" aria-hidden />}
        iconBadge
        title="Nothing to review yet"
        description="Once an order is delivered, you'll be able to rate and review each item here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ReviewableItemRow key={item.orderItemId} item={item} />
      ))}
    </div>
  );
}
