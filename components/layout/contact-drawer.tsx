"use client";

import { useState, type ComponentType } from "react";
import { ChevronRight, Mail, MessageCircle, Phone } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/libs/cn";
import CONFIG from "@/utils/config";

export const CONTACT_METHODS: {
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press text-xs text-muted underline underline-offset-2 hover:text-foreground"
      >
        Contact us
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} side="left" title="Contact us" labelId="contact-drawer-heading">
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
      </Drawer>
    </>
  );
}
