import { CornerDownRight, Star } from "lucide-react";
import type { Review } from "@/types/catalog";
import { formatDate } from "@/libs/format";

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex gap-0.5 text-warning" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={i < Math.round(value) ? "size-4 fill-current" : "size-4 text-line"} aria-hidden />
      ))}
    </div>
  );
}

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{review.author}</p>
            <time dateTime={review.date} className="text-xs text-muted">
              {formatDate(review.date)}
            </time>
          </div>
          <div className="mt-1">
            <Stars value={review.rating} label={`${review.rating} out of 5 stars`} />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{review.body}</p>
          {review.vendorReply && (
            <p className="mt-4 flex gap-2 rounded-xl bg-surface-muted p-3 text-sm">
              <CornerDownRight className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <span>
                <span className="font-medium">Reply from the vendor:</span> <span className="text-muted">{review.vendorReply}</span>
              </span>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
