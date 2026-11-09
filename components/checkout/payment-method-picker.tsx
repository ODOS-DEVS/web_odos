"use client";

import { useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/cn";
import { LogoBadge, type Logo } from "./logo-badge";

export type PaymentMethod = {
  id: string;
  label: string;
  subtitle: string;
  cta: string;
  kind: "wallet" | "momo" | "card";
  isDefault?: boolean;
  logo: Logo;
};


export function PaymentMethodPicker({
  value,
  options,
  onChange,
}: {
  value: PaymentMethod;
  /** The shopper's real options — see `usePaymentOptions`. */
  options: PaymentMethod[];
  onChange: (method: PaymentMethod) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogoBadge logo={value.logo} className="size-10" />
          <div>
            <Badge tone="neutral" className="mb-1.5">
              Payment option
            </Badge>
            <p className="text-lg font-semibold">{value.label}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse payment methods" : "Expand payment methods"}
          className="press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <ChevronDown className={cn("size-4 transition-transform", expanded ? "rotate-180" : "-rotate-90")} aria-hidden />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="press mt-3 ml-auto flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80"
      >
        <RefreshCw className="size-3.5" aria-hidden />
        Change payment method
      </button>

      {expanded && (
        <div className="mt-5 space-y-4 border-t border-dashed border-line pt-5">
          <p className="text-sm font-medium">Choose a payment method</p>
          <div className="space-y-3">
            {options.map((method) => (
              <PaymentMethodRow
                key={method.id}
                method={method}
                selected={method.id === value.id}
                onSelect={() => {
                  onChange(method);
                  setExpanded(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentMethodRow({ method, selected, onSelect }: { method: PaymentMethod; selected: boolean; onSelect: () => void }) {
  return (
    <div className={cn("rounded-2xl border p-4", selected ? "border-accent" : "border-line")}>
      <div className="flex items-center gap-3">
        <LogoBadge logo={method.logo} className="size-10" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{method.label}</p>
            {method.isDefault && <Badge tone="neutral">Default</Badge>}
          </div>
          <p className="truncate text-xs text-muted">{method.subtitle}</p>
        </div>
      </div>
      <Button type="button" variant="accent" size="sm" className="mt-3 w-full" onClick={onSelect}>
        {method.cta}
      </Button>
    </div>
  );
}
