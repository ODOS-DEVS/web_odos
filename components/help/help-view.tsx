"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, FileText, LifeBuoy, Mail, MessageSquare, Phone, Search, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/libs/cn";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/libs/faq-content";
import CONFIG from "@/utils/config";

/** ODOS's own support channels, not a store's. */
const SUPPORT_EMAIL = "info@odos.market";

/**
 * Terms, privacy and the support page are rendered by the backend, not duplicated here — one copy
 * of a legal document is the only safe number.
 */
const LEGAL = [
  { href: "/support", label: "Support centre", icon: LifeBuoy, blurb: "Policies, escalation and contact routes." },
  { href: "/terms", label: "Terms of service", icon: FileText, blurb: "The agreement you accept when you order." },
  { href: "/privacy", label: "Privacy policy", icon: ShieldCheck, blurb: "What we collect and why." },
];

function FaqRow({ item }: { item: (typeof FAQ_ITEMS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press flex w-full items-center gap-3 py-4 text-left"
      >
        <span className="min-w-0 flex-1 text-sm font-medium">{item.question}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="pb-4">
          {item.answer.map((line) => (
            <p key={line} className="mt-1 text-sm leading-6 text-muted first:mt-0">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function HelpView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | "all">("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.some((line) => line.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of FAQ_ITEMS) map.set(item.category, (map.get(item.category) ?? 0) + 1);
    return map;
  }, []);

  return (
    <Container className="py-8 sm:py-10">
      <SectionHeading
        title="Help & support"
        description={`${FAQ_ITEMS.length} answers about ordering, delivery, payment, vouchers and returns.`}
      />

      <div className="relative mt-6 max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search help"
          placeholder="Search for an answer"
          className="h-12 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
        />
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "press shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium",
            category === "all" ? "border-foreground bg-foreground text-background" : "border-line hover:border-foreground",
          )}
        >
          All {FAQ_ITEMS.length}
        </button>
        {FAQ_CATEGORIES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCategory(name)}
            className={cn(
              "press shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium",
              category === name ? "border-foreground bg-foreground text-background" : "border-line hover:border-foreground",
            )}
          >
            {name} {counts.get(name)}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-line bg-surface px-5">
            {rows.length > 0 ? (
              rows.map((item) => <FaqRow key={item.id} item={item} />)
            ) : (
              <div className="py-6">
                <EmptyState
                  icon={<Search className="size-10 text-muted" aria-hidden />}
                  title="No answer matches"
                  description="Try different words, or contact support below and we'll help directly."
                />
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">Still need help?</h2>
            <p className="mt-1 text-sm text-muted">Reach the ODOS team directly.</p>
            <div className="mt-4 space-y-2.5 text-sm">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="press flex items-center gap-2.5 text-accent">
                <Mail className="size-4 shrink-0" aria-hidden />
                {SUPPORT_EMAIL}
              </a>
              <Link href="/account?tab=chats" className="press flex items-center gap-2.5">
                <MessageSquare className="size-4 shrink-0 text-muted" aria-hidden />
                Your conversations
              </Link>
              <Link href="/orders" className="press flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-muted" aria-hidden />
                Message a store about an order
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">Policies</h2>
            <ul className="mt-3 space-y-3">
              {LEGAL.map(({ href, label, icon: Icon, blurb }) => (
                <li key={href}>
                  <a
                    href={`${CONFIG.API_BASE_URL}${href}`}
                    target="_blank"
                    rel="noreferrer"
                    className="press flex items-start gap-2.5"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-muted">{blurb}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}
