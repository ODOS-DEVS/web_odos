"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Heart, Plus, Share2 } from "lucide-react";
import { cn } from "@/libs/cn";
import { shareLink } from "@/libs/share";

export type SpeedDialAction = {
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  active?: boolean;
};

/**
 * The favorite + share pair every card's speed-dial includes (products, stores…). Cards with an extra
 * entity-specific action (e.g. add to cart) prepend it to this list.
 */
export function favoriteShareActions({
  name,
  href,
  saved,
  onToggleFavorite,
}: {
  /** Shown in the a11y label and the shared link's title. */
  name: string;
  /** Path to share, e.g. `/products/${id}`. */
  href: string;
  saved: boolean;
  onToggleFavorite: () => void;
}): SpeedDialAction[] {
  return [
    {
      key: "favorite",
      label: saved ? `Remove ${name} from saved` : `Save ${name}`,
      icon: <Heart className={cn("size-4", saved && "fill-danger")} aria-hidden />,
      active: saved,
      onSelect: onToggleFavorite,
    },
    {
      key: "share",
      label: `Share ${name}`,
      icon: <Share2 className="size-4" aria-hidden />,
      onSelect: () => shareLink(name, href),
    },
  ];
}

const itemClass =
  "press grid size-9 place-items-center rounded-full bg-surface/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-accent";

/**
 * A bottom-right FAB (the old quick-add button's look) that fans quick actions left on compact cards
 * and upward from `sm` onward — room for add-to-cart, favorite, and share behind one plus icon.
 */
export function SpeedDial({ actions, className }: { actions: SpeedDialAction[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") setOpen(false);
        return;
      }
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const toggle = (event: MouseEvent) => {
    event.preventDefault();
    setOpen((value) => !value);
  };

  return (
    <div ref={rootRef} className={cn("relative z-30", className)}>
      <div
        className={cn(
          "absolute right-11 bottom-0 z-40 flex flex-row-reverse items-center gap-1.5 transition-all duration-200 ease-out sm:right-0 sm:bottom-11 sm:flex-col sm:items-end sm:gap-2",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
        )}
      >
        {actions.map((action, index) => (
          <button
            key={action.key}
            type="button"
            onClick={(event: MouseEvent) => {
              event.preventDefault();
              action.onSelect();
              setOpen(false);
            }}
            aria-label={action.label}
            aria-pressed={action.active}
            style={{ transitionDelay: open ? `${index * 30}ms` : "0ms" }}
            className={cn(itemClass, action.active && "text-danger")}
          >
            {action.icon}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Close quick actions" : "Quick actions"}
        className="press relative z-40 grid size-10 place-items-center rounded-full bg-foreground text-background shadow-sm hover:opacity-85"
      >
        <Plus className={cn("size-5 transition-transform duration-200", open && "rotate-45")} aria-hidden />
      </button>
    </div>
  );
}
