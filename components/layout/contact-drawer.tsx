"use client";

import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Mail, MessageCircle, Phone, X } from "lucide-react";
import { cn } from "@/libs/cn";
import CONFIG from "@/utils/config";

const CONTACT_METHODS: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tone: string;
  title: string;
  subtitle: string;
  href: string;
  external?: boolean;
}[] = [
  {
    icon: Mail,
    tone: "bg-accent-soft text-accent",
    title: "Email us",
    subtitle: "support@odos.market",
    href: "mailto:support@odos.market",
  },
  {
    icon: Phone,
    tone: "bg-surface-muted text-foreground",
    title: "Call us",
    subtitle: "+233 20 000 0000",
    href: "tel:+233200000000",
  },
  {
    icon: MessageCircle,
    tone: "bg-success-soft text-success",
    title: "WhatsApp",
    subtitle: "Chat with our team",
    href: "https://wa.me/233200000000",
    external: true,
  },
];

/** Footer trigger for a left-side contact drawer. Owns its own open state; no route or query param involved. */
export function ContactUsButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press text-xs text-muted underline underline-offset-2 hover:text-foreground"
      >
        Contact us
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close contact drawer"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-drawer-heading"
              className="slide-in-left absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 id="contact-drawer-heading" className="text-lg font-semibold">
                  Contact us
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="press grid size-9 place-items-center rounded-full hover:bg-surface-muted"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                <p className="text-sm leading-6 text-muted">
                  Questions about an order, a vendor, or {CONFIG.SITE_NAME} itself? We usually reply within a day.
                </p>

                <div className="mt-6 space-y-3">
                  {CONTACT_METHODS.map(({ icon: Icon, tone, title, subtitle, href, external }) => (
                    <a
                      key={title}
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="press group flex items-center gap-3 rounded-2xl border border-line p-4 hover:border-foreground"
                    >
                      <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", tone)}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{title}</span>
                        <span className="block truncate text-xs text-muted">{subtitle}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
