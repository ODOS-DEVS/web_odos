"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useScrollLockedEscape } from "@/hooks/use-scroll-locked-escape";
import { cn } from "@/libs/cn";

/** Shared slide-in panel (contact, favorites, …): portal, overlay, Escape/scroll-lock, header with close. */
export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  labelId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title: string;
  labelId: string;
  children: ReactNode;
}) {
  useScrollLockedEscape(open, onClose);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className={cn(
          "absolute inset-y-0 flex w-full max-w-sm flex-col bg-surface shadow-2xl",
          side === "left" ? "slide-in-left left-0" : "slide-in-right right-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={labelId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="press grid size-9 place-items-center rounded-full hover:bg-surface-muted"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
