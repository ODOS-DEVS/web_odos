"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { Rating } from "@/components/ui/rating";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useReplyToReview, useVendorReviews } from "@/hooks/use-vendor-ops";
import { formatDate } from "@/libs/format";
import type { VendorReview } from "@/types/vendor";

const PAGE_SIZE = 6;

type ReviewFilter = "all" | "unanswered";

function ReviewCard({ review }: { review: VendorReview }) {
  const reply = useReplyToReview();
  // Null while closed; prefilled with the existing reply when editing it.
  const [draft, setDraft] = useState<string | null>(null);

  const send = () => {
    const text = (draft ?? "").trim();
    if (!text) return;
    reply.mutate(
      { reviewId: review.id, reply: text },
      {
        onSuccess: () => {
          setDraft(null);
          toast.success("Reply posted");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn’t post that reply."),
      },
    );
  };

  return (
    <li className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Media src={review.productImageUrl} name={review.productTitle} className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="truncate font-medium">{review.productTitle}</p>
            {review.isHidden && <Badge tone="warning">Hidden from shoppers</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <Rating value={review.rating} />
            <span>{review.customerName}</span>
            <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
          </div>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm">{review.comment}</p>

      {review.vendorReply && draft === null ? (
        <div className="mt-4 rounded-xl bg-surface-muted p-3.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-muted">
              Your reply
              {review.vendorRepliedAt && (
                <>
                  {" · "}
                  <time dateTime={review.vendorRepliedAt} className="font-normal">
                    {formatDate(review.vendorRepliedAt)}
                  </time>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => setDraft(review.vendorReply ?? "")}
              className="press text-xs font-medium text-accent underline-offset-4 hover:underline"
            >
              Edit
            </button>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap">{review.vendorReply}</p>
        </div>
      ) : draft !== null ? (
        <div className="mt-4">
          <label htmlFor={`reply-${review.id}`} className="sr-only">
            Reply to {review.customerName}
          </label>
          <textarea
            id={`reply-${review.id}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={1000}
            autoFocus
            placeholder="Thank them, or explain what you’ll do differently — every shopper on the product page sees this."
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={send} disabled={reply.isPending || !(draft ?? "").trim()}>
              {reply.isPending ? "Posting…" : "Post reply"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={reply.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => setDraft("")}>
            <MessageSquare className="size-4" aria-hidden />
            Reply
          </Button>
        </div>
      )}
    </li>
  );
}

export function VendorReviewsTab() {
  const reviews = useVendorReviews();
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const all = reviews.data ?? [];
    return filter === "unanswered" ? all.filter((r) => !r.vendorReply) : all;
  }, [reviews.data, filter]);

  if (reviews.isPending) return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  if (reviews.isError) return <QueryError error={reviews.error} onRetry={() => reviews.refetch()} />;

  const all = reviews.data ?? [];
  const unanswered = all.filter((r) => !r.vendorReply).length;
  const average = all.length ? all.reduce((sum, r) => sum + r.rating, 0) / all.length : 0;

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {all.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Rating value={average} />
            <span className="font-semibold tabular-nums">{average.toFixed(1)}</span>
            <span className="text-muted">
              · {all.length} {all.length === 1 ? "review" : "reviews"}
            </span>
          </div>
          <div className="flex gap-2">
            <TogglePill selected={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }}>
              All
            </TogglePill>
            <TogglePill selected={filter === "unanswered"} onClick={() => { setFilter("unanswered"); setPage(1); }}>
              Unanswered{unanswered > 0 && ` (${unanswered})`}
            </TogglePill>
          </div>
        </div>
      )}

      {pageRows.length > 0 ? (
        <>
          <ul className="space-y-3">
            {pageRows.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={<Star className="size-10 text-muted" aria-hidden />}
          title={all.length === 0 ? "No reviews yet" : "All caught up"}
          description={
            all.length === 0
              ? "Reviews shoppers leave on your products will show up here."
              : "Every review has a reply. Nice."
          }
        />
      )}
    </div>
  );
}
