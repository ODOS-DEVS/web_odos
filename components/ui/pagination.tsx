import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/libs/cn";

/** Prev/next pager for a client-side paginated list — "Page X of Y", hidden when everything fits on one page. */
export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-3", className)}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="press grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface hover:border-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <p className="text-sm text-muted tabular-nums">
        Page {page} of {totalPages}
      </p>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="press grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface hover:border-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
