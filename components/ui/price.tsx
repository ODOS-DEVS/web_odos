import { cn } from "@/libs/cn";
import { formatMoneyCompact } from "@/libs/format";

export function Price({
  value,
  compareAt,
  className,
  size = "md",
}: {
  value: number;
  compareAt?: number;
  className?: string;
  size?: "md" | "lg";
}) {
  const onSale = compareAt !== undefined && compareAt > value;
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
      <span
        className={cn(
          "font-semibold",
          size === "lg" ? "text-2xl" : "text-base",
          onSale && "text-accent",
        )}
      >
        {formatMoneyCompact(value)}
      </span>
      {onSale && (
        <span className={cn("text-muted line-through", size === "lg" ? "text-base" : "text-sm")}>
          {formatMoneyCompact(compareAt)}
        </span>
      )}
    </span>
  );
}
