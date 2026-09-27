import { Star } from "lucide-react";
import { formatCount } from "@/libs/format";
import { cn } from "@/libs/cn";

export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-sm", className)}
      aria-label={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ""}`}
    >
      <Star className="size-3.5 fill-current text-warning" aria-hidden />
      <span className="font-medium tabular-nums">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-muted tabular-nums">({formatCount(count)})</span>
      )}
    </span>
  );
}
