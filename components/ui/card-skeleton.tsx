import { cn } from "@/libs/cn";

/** The placeholder shape shared by every card grid (products, stores): an image block plus two text bars. */
export function CardSkeleton({ aspect = "aspect-square", className }: { aspect?: string; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn(aspect, "animate-pulse rounded-2xl bg-surface-muted")} />
      <div className="h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
    </div>
  );
}
