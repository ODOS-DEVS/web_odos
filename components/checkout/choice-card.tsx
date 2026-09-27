import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

/** Native radio wrapped in a selectable card; keyboard and screen-reader friendly by default. */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  trailing,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "press flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4 hover:border-foreground/50 has-checked:border-foreground has-checked:ring-1 has-checked:ring-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-0.5 size-4 shrink-0 accent-(--accent)"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      {trailing && <span className="shrink-0 text-sm font-medium tabular-nums">{trailing}</span>}
    </label>
  );
}
