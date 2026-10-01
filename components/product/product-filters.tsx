import type { Category, Store } from "@/types/catalog";
import { buildHref } from "@/libs/url";
import { FilterChip, FilterGroup } from "./filter-chip";

export type ActiveFilters = {
  q?: string;
  category?: string;
  store?: string;
  tag?: string;
  free?: string;
  sort?: string;
};

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
      <FilterGroup label="Category">
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
      </FilterGroup>

      <FilterGroup label="Store">
        <FilterChip href={href({ store: undefined })} active={!active.store}>
          All stores
        </FilterChip>
        {stores.map((store) => (
          <FilterChip key={store.id} href={href({ store: store.slug })} active={active.store === store.slug}>
            {store.name}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Delivery">
        <FilterChip href={href({ free: active.free ? undefined : "1" })} active={Boolean(active.free)}>
          Free delivery
        </FilterChip>
        <FilterChip
          href={href({ tag: active.tag === "flash" ? undefined : "flash" })}
          active={active.tag === "flash"}
        >
          On sale
        </FilterChip>
      </FilterGroup>
    </aside>
  );
}
