import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

/** Title row at the top of every portal page, with optional actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-line bg-surface", className)}>{children}</div>;
}

export function PanelHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {action}
    </div>
  );
}

/** A headline number. `tone` tints the value when it represents work owed or a problem. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "accent" | "warning" | "danger" | "success";
  className?: string;
}) {
  const valueTone = {
    default: "text-foreground",
    accent: "text-accent",
    warning: "text-warning",
    danger: "text-danger",
    success: "text-success",
  }[tone];

  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon && <span className="shrink-0 text-muted">{icon}</span>}
      </div>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums", valueTone)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Horizontally scrollable wrapper so a wide table never makes the page scroll sideways. */
export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="min-w-[44rem]">{children}</div>
    </div>
  );
}

export function SkeletonRows({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-muted" />
      ))}
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
      ))}
    </div>
  );
}

/** Search box used across the portal's list pages. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  icon,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">{icon}</span>
      <input
        type="search"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
      />
    </div>
  );
}

export function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm focus:border-foreground focus:outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Segmented control for queue tabs and period switches. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-full border border-line bg-surface p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "press rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap",
              active ? "bg-foreground text-background" : "text-muted hover:text-foreground",
            )}
          >
            {option.label}
            {typeof option.count === "number" && option.count > 0 && (
              <span className={cn("ml-1.5 tabular-nums", active ? "opacity-80" : "text-muted")}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
