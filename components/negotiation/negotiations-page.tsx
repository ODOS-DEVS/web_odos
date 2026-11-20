"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { NEGOTIATION_FILTERS, NegotiationList } from "@/components/negotiation/negotiation-list";
import { useNegotiationCounts } from "@/hooks/use-negotiations";
import { cn } from "@/libs/cn";
import type { NegotiationActor } from "@/types/negotiation";

/** The filter strip plus the list, shared by the shopper and vendor pages. */
export function NegotiationsPage({
  viewerRole,
  basePath,
  title,
  description,
  bare = false,
}: {
  viewerRole: NegotiationActor;
  basePath: string;
  title: string;
  description: string;
  /** Rendered inside an existing shell (the seller layout) rather than as a full page. */
  bare?: boolean;
}) {
  const [filter, setFilter] = useState<string>("all");
  const counts = useNegotiationCounts(viewerRole);

  const badgeFor = (id: string) => {
    const c = counts.data;
    if (!c) return null;
    const value =
      id === "all" ? c.total
      : id === "awaiting_me" ? c.awaitingMe
      : id === "awaiting_them" ? c.awaitingThem
      : id === "agreed" ? c.agreed
      : id === "completed" ? c.completed
      : id === "rejected" ? c.rejected
      : id === "expired" ? c.expired
      : 0;
    return value > 0 ? value : null;
  };

  const body = (
    <>
      <header className="mb-6">
        <h1 className={cn("font-semibold tracking-tight", bare ? "text-2xl" : "text-3xl sm:text-4xl")}>{title}</h1>
        <p className="mt-2 text-muted">{description}</p>
      </header>

      <nav aria-label="Filter negotiations" className="-mx-1 mb-5">
        <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          {NEGOTIATION_FILTERS.map((option) => {
            const active = filter === option.id;
            const badge = badgeFor(option.id);
            return (
              <li key={option.id} className="snap-start">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.id)}
                  className={cn(
                    "press inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-line bg-surface hover:border-foreground/40",
                  )}
                >
                  {option.label}
                  {badge !== null && <span className="text-xs opacity-70">{badge}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <NegotiationList viewerRole={viewerRole} filter={filter} basePath={basePath} />
    </>
  );

  return bare ? <div>{body}</div> : <Container className="py-10">{body}</Container>;
}
