import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

/** A labelled, horizontally-scrolling (on small screens) row of `FilterChip`s — one filter sidebar group. */
export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">{label}</h2>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {children}
      </div>
    </div>
  );
}

export function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "press inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm pointer-coarse:min-h-11",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-line bg-surface hover:border-foreground",
      )}
    >
      {children}
    </Link>
  );
}
