"use client";

import Link from "next/link";
import { cn } from "@/libs/cn";
import type { Store, StoreSection } from "@/types/catalog";

/**
 * The shop's own shelves, as a scrollable row of pills.
 *
 * Links rather than client-side filters: each shelf has a real page, so a shopper can land on
 * one from a shared link and a crawler can reach it. "All products" stays first and points at
 * the store page itself, so products on no shelf are never stranded.
 *
 * Horizontal scroll with snap on small screens — a shop with twelve shelves must not push the
 * product grid off the fold on a phone.
 */
export function StoreSectionNav({
  store,
  sections,
  total,
  activeSlug,
}: {
  store: Store;
  sections: StoreSection[];
  total?: number;
  /** Set on a section page so the current shelf reads as selected. */
  activeSlug?: string;
}) {
  // One shelf and nothing else is not navigation — the page already shows it.
  if (sections.length === 0) return null;

  return (
    <nav aria-label={`${store.name} sections`} className="-mx-1">
      <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        <li className="snap-start">
          <Pill href={`/stores/${store.slug}`} active={!activeSlug}>
            All products
            {typeof total === "number" && <Count>{total}</Count>}
          </Pill>
        </li>
        {sections.map((section) => (
          <li key={section.id} className="snap-start">
            <Pill
              href={`/stores/${store.slug}/sections/${section.slug}`}
              active={activeSlug === section.slug}
            >
              {section.title}
              {section.products.length > 0 && <Count>{section.products.length}</Count>}
            </Pill>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "press inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-line bg-surface hover:border-foreground/40",
      )}
    >
      {children}
    </Link>
  );
}

const Count = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs opacity-60">{children}</span>
);
