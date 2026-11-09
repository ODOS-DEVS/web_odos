"use client";

import { useState } from "react";
import { FilterChip, FilterGroup } from "@/components/product/filter-chip";
import type { Category } from "@/types/catalog";

/** How many category chips to show before the list collapses behind "Show all". */
const VISIBLE = 8;

/**
 * The category filter. There are dozens of categories, which made the sidebar longer than the
 * results it was filtering, so the list is capped and the rest sits behind a toggle. The selected
 * category is always shown even when it falls outside the cap — otherwise the active filter would
 * vanish from the list that set it.
 */
export function CategoryFilterGroup({
  categories,
  active,
  hrefFor,
}: {
  categories: Category[];
  active?: string;
  hrefFor: (slug: string | undefined) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? categories : categories.slice(0, VISIBLE);
  const activeOutsideCap =
    !expanded && active ? categories.find((c) => c.slug === active && !visible.includes(c)) : undefined;
  const shown = activeOutsideCap ? [...visible, activeOutsideCap] : visible;
  const hidden = categories.length - shown.length;

  return (
    <FilterGroup label="Category">
      <FilterChip href={hrefFor(undefined)} active={!active}>
        All
      </FilterChip>
      {shown.map((category) => (
        <FilterChip key={category.id} href={hrefFor(category.slug)} active={active === category.slug}>
          {category.name}
        </FilterChip>
      ))}
      {(hidden > 0 || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="press inline-flex shrink-0 items-center rounded-full border border-dashed border-line bg-surface px-3.5 py-2 text-sm font-medium text-accent hover:border-accent pointer-coarse:min-h-11"
        >
          {expanded ? "Show less" : `Show all ${categories.length}`}
        </button>
      )}
    </FilterGroup>
  );
}
