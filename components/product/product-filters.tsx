import type { Category, Store } from "@/types/catalog";
import { buildHref } from "@/libs/url";
import { CategoryFilterGroup } from "./category-filter-group";
import { FilterChip, FilterGroup } from "./filter-chip";

export type ActiveFilters = {
  q?: string;
  category?: string;
  subcategory?: string;
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

  // Only the chosen category's own types are offered — the full list across every category would
  // be hundreds of chips, most of which match nothing.
  const subcategories = active.category
    ? (categories.find((c) => c.slug === active.category)?.subcategories ?? [])
    : [];

  return (
    <aside aria-label="Filters" className="space-y-6">
      <CategoryFilterGroup
        categories={categories}
        active={active.category}
        /* Changing category clears any subcategory: "Dresses" means nothing under Electronics. */
        hrefFor={(slug) => href({ category: slug, subcategory: undefined })}
      />

      {subcategories.length > 0 && (
        <FilterGroup label="Type">
          <FilterChip href={href({ subcategory: undefined })} active={!active.subcategory}>
            All types
          </FilterChip>
          {subcategories.map((name) => (
            <FilterChip key={name} href={href({ subcategory: name })} active={active.subcategory === name}>
              {name}
            </FilterChip>
          ))}
        </FilterGroup>
      )}

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
