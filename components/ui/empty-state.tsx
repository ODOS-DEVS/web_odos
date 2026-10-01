import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

/** Dashed-border "nothing here" block — no results, empty cart, gated content, etc. */
export function EmptyState({
  icon,
  iconBadge,
  title,
  description,
  action,
  role,
  className,
}: {
  icon: ReactNode;
  /** Wrap the icon in a soft circle badge (used for gated/auth-style states). */
  iconBadge?: boolean;
  title: string;
  description?: string;
  action?: ReactNode;
  /** e.g. "alert" for an error state, so assistive tech announces it immediately. */
  role?: string;
  className?: string;
}) {
  return (
    <div role={role} className={cn("grid place-items-center rounded-3xl border border-dashed border-line px-6 py-20 text-center", className)}>
      {iconBadge ? <span className="grid size-14 place-items-center rounded-full bg-surface-muted">{icon}</span> : icon}
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
