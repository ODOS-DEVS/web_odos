"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { inputClass } from "@/components/ui/field";
import { useVendorReviews } from "@/hooks/use-vendor";
import { cn } from "@/libs/cn";
import { formatDate } from "@/libs/format";
import type { VendorReviewRead } from "@/types/vendor";

export function VendorReviewsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading vendor reviews">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-5 animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-12 shrink-0 rounded-xl bg-surface-muted" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-40 rounded bg-surface-muted" />
              <div className="h-3 w-28 rounded bg-surface-muted" />
            </div>
            <div className="h-4 w-20 rounded bg-surface-muted" />
          </div>
          <div className="h-10 w-full rounded-xl bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: VendorReviewRead }) {
  const { replyReview, isReplying } = useVendorReviews();
  const [isReplyingOpen, setIsReplyingOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.vendor_reply ?? "");

  const onReplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await replyReview({ reviewId: review.id, reply: replyText.trim() });
      toast.success("Reply saved");
      setIsReplyingOpen(false);
    } catch {
      toast.error("Failed to post reply");
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Media
            src={review.product_image_url ?? null}
            name={review.product_title}
            sizes="48px"
            className="size-12 shrink-0 rounded-xl"
          />
          <div className="min-w-0">
            <p className="font-semibold truncate">{review.product_title}</p>
            <p className="text-xs text-muted">
              {review.customer_name ?? "Verified Buyer"} · {formatDate(review.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-warning shrink-0">
          <Star className="size-4 fill-current" />
          <span className="text-sm font-bold text-foreground tabular-nums">{review.rating}</span>
        </div>
      </div>

      <p className="text-sm text-foreground/90 leading-relaxed">{review.comment}</p>

      {review.vendor_reply && !isReplyingOpen && (
        <div className="rounded-xl border border-line/60 bg-surface-muted p-3.5 text-xs text-muted">
          <p className="font-semibold text-foreground mb-1">Your reply:</p>
          <p className="leading-relaxed">{review.vendor_reply}</p>
        </div>
      )}

      {!isReplyingOpen ? (
        <button
          type="button"
          onClick={() => setIsReplyingOpen(true)}
          className="press inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:opacity-80"
        >
          <MessageSquare className="size-3.5" />
          {review.vendor_reply ? "Edit reply" : "Reply to customer"}
        </button>
      ) : (
        <form onSubmit={onReplySubmit} className="space-y-3 border-t border-line/60 pt-3">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a courteous public reply to this review…"
            className={cn(inputClass, "h-auto resize-none py-2 text-xs")}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" variant="accent" size="sm" disabled={isReplying}>
              {isReplying ? "Saving…" : "Save reply"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsReplyingOpen(false)} disabled={isReplying}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function VendorReviewsTab() {
  const { reviews, isLoading } = useVendorReviews();

  if (isLoading && reviews.length === 0) {
    return <VendorReviewsSkeleton />;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<Star className="size-10 text-muted" aria-hidden />}
        title="No product reviews yet"
        description="Customer reviews and feedback for products in your catalog will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewRow key={review.id} review={review} />
      ))}
    </div>
  );
}

