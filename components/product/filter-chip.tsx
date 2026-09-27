import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

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
