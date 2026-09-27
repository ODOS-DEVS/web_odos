import type { ReactNode } from "react";
import type { Category, Store } from "@/types/catalog";
import { buildHref } from "@/libs/url";
import { FilterChip } from "./filter-chip";

export type ActiveFilters = {
  q?: string;
  category?: string;
  store?: string;
  tag?: string;
  free?: string;
  sort?: string;
};

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">{label}</h2>
      {/* Horizontal scroller on small screens, wrapping list in the sidebar. */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {children}
      </div>
    </div>
  );
}

export function ProductFilters({
  active,
  categories,
  stores,
}: {
  active: ActiveFilters;
  categories: Category[];
  stores: Store[];
}) {
  const href = (patch: Record<string, string | undefined>) => buildHref("/products", active, patch);

  return (
    <aside aria-label="Filters" className="space-y-6">
      <Group label="Category">
        <FilterChip href={href({ category: undefined })} active={!active.category}>
          All
        </FilterChip>
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            href={href({ category: category.slug })}
            active={active.category === category.slug}
          >
            {category.name}
          </FilterChip>
        ))}
      </Group>

      <Group label="Store">
        <FilterChip href={href({ store: undefined })} active={!active.store}>
          All stores
        </FilterChip>
        {stores.map((store) => (
          <FilterChip key={store.id} href={href({ store: store.slug })} active={active.store === store.slug}>
            {store.name}
          </FilterChip>
        ))}
      </Group>

      <Group label="Delivery">
        <FilterChip href={href({ free: active.free ? undefined : "1" })} active={Boolean(active.free)}>
          Free delivery
        </FilterChip>
        <FilterChip
          href={href({ tag: active.tag === "flash" ? undefined : "flash" })}
          active={active.tag === "flash"}
        >
          On sale
        </FilterChip>
      </Group>
    </aside>
  );
}
