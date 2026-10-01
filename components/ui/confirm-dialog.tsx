"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

/** Centered "are you sure?" modal — confirm/cancel only, no form fields. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  pending,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close" onClick={onCancel} className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-heading"
        className="rise-in relative w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl"
      >
        <h2 id="confirm-dialog-heading" className="text-lg font-semibold">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}
        <div className="mt-6 flex flex-col gap-2.5">
          <Button type="button" size="lg" className="w-full" onClick={onConfirm} disabled={pending}>
            {pending ? "Please wait…" : confirmLabel}
          </Button>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
