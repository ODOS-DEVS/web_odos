"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/libs/cn";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  label = "Quantity",
  size = "md",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const button = cn(
    "press grid place-items-center rounded-full hover:bg-surface-muted disabled:opacity-40 disabled:pointer-events-none",
    size === "sm" ? "size-7 pointer-coarse:size-9" : "size-9 pointer-coarse:size-11",
  );

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-surface p-0.5",
        className,
      )}
    >
      <button
        type="button"
        className={button}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <output
        className={cn(
          "text-center text-sm font-medium tabular-nums",
          size === "sm" ? "min-w-7" : "min-w-9",
        )}
        aria-live="polite"
      >
        {value}
      </output>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
