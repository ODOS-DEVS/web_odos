"use client";

import { useState } from "react";
import { Check, ChevronDown, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/libs/cn";

function parseSpecification(spec: string): { key: string | null; value: string } {
  const colonIndex = spec.indexOf(":");
  if (colonIndex > 0 && colonIndex < 35) {
    return {
      key: spec.slice(0, colonIndex).trim(),
      value: spec.slice(colonIndex + 1).trim(),
    };
  }
  return { key: null, value: spec };
}

interface ProductSpecificationsProps {
  specifications: string[];
  defaultOpen?: boolean;
}

/**
 * Collapsible accordion for product specifications.
 * Keeps the page compact by folding extensive feature lists into a clean, expandable card.
 */
export function ProductSpecifications({
  specifications,
  defaultOpen = false,
}: ProductSpecificationsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!specifications || specifications.length === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border border-line bg-surface overflow-hidden transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 p-4 sm:p-4.5 text-left transition-colors hover:bg-surface-muted/50 cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <ListChecks className="size-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-foreground truncate">
            Specifications
          </span>
          <Badge tone="neutral" className="text-[11px] font-medium shrink-0">
            {specifications.length}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-200",
            isOpen && "rotate-180 text-foreground"
          )}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className="border-t border-line/60 bg-surface-muted/20 px-4 py-2 sm:px-5">
          <div className="divide-y divide-line/40">
            {specifications.map((spec, i) => {
              const { key, value } = parseSpecification(spec);
              return (
                <div key={i} className="flex items-start gap-2.5 py-2 text-xs sm:text-sm">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                  <div className="min-w-0 flex-1 leading-snug">
                    {key ? (
                      <>
                        <span className="font-medium text-foreground">{key}: </span>
                        <span className="text-muted">{value}</span>
                      </>
                    ) : (
                      <span className="text-muted">{value}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

