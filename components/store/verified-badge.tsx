"use client";

import { BadgeCheck } from "lucide-react";
import { cn } from "@/libs/cn";

const SIZES = {
  sm: "size-4",
  md: "size-[1.125rem]",
  lg: "size-6",
} as const;

/**
 * The mark shown after a verified store's name.
 *
 * Driven entirely by `store.isVerified`, which the API computes from the owning vendor's
 * approval status — so a pending, rejected or suspended vendor simply never gets one. Nothing
 * here decides who is verified; this only draws it.
 *
 * Rendered as an inline element with a title and screen-reader text rather than a bare icon:
 * a tick with no accessible name reads as decoration, and this one carries meaning. It sits
 * inside the heading it belongs to so it wraps with the name rather than orphaning onto its
 * own line.
 */
export function VerifiedBadge({
  size = "md",
  className,
  label = "Verified ODOS store",
}: {
  size?: keyof typeof SIZES;
  className?: string;
  label?: string;
}) {
  return (
    <span
      title={`${label} — this business completed ODOS's vendor verification.`}
      className={cn("inline-flex shrink-0 translate-y-[0.08em] items-center align-middle text-accent", className)}
    >
      <BadgeCheck className={cn(SIZES[size], "fill-accent/15")} aria-hidden strokeWidth={2.25} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * The badge plus its explanation, for somewhere with room to say it — the store page header.
 * Deliberately says nothing about *how* the vendor was verified: the API exposes a boolean and
 * nothing else, and identity documents are never part of this.
 */
export function VerifiedNote({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent",
        className,
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden strokeWidth={2.5} />
      Verified ODOS store
    </span>
  );
}
