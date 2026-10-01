import type { ButtonHTMLAttributes } from "react";
import type { Logo } from "@/components/checkout/logo-badge";
import { LogoBadge } from "@/components/checkout/logo-badge";
import { cn } from "@/libs/cn";

type ToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & { selected: boolean };

/** A single rounded-pill choice — size/variant pickers, momo-vs-card toggles, quick-amount chips, etc. */
export function TogglePill({ selected, className, children, ...props }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "press min-w-11 rounded-full border px-3.5 py-2 text-sm font-medium pointer-coarse:min-h-11",
        selected ? "border-foreground bg-foreground text-background" : "border-line bg-surface hover:border-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** A `TogglePill` fronted by a `LogoBadge` — picking a payment network, a saved card, etc. */
export function LogoPill({ selected, logo, label, className, ...props }: ToggleProps & { logo: Logo; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "press flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5 text-sm",
        selected ? "border-foreground" : "border-line hover:border-foreground",
        className,
      )}
      {...props}
    >
      <LogoBadge logo={logo} className="size-6" />
      {label}
    </button>
  );
}
