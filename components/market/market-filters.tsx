import type { Category, Store } from "@/types/catalog";
import type { Market } from "@/mocks/catalog.mock";
import { buildHref } from "@/libs/url";
import { FilterChip, FilterGroup } from "@/components/product/filter-chip";

export type MarketActiveFilters = {
  category?: string;
  store?: string;
  market?: string;
  free?: string;
  sale?: string;
};

export function MarketFilters({
  active,
  categories,
  stores,
  markets,
}: {
  active: MarketActiveFilters;
  categories: Category[];
  stores: Store[];
  markets: Market[];
}) {
  const href = (patch: Record<string, string | undefined>) => buildHref("/market", active, patch);

  return (
    <aside aria-label="Filters" className="space-y-6">
      <FilterGroup label="Category">
        <FilterChip href={href({ category: undefined })} active={!active.category}>
          All
        </FilterChip>
        {categories.map((category) => (
          <FilterChip key={category.id} href={href({ category: category.slug })} active={active.category === category.slug}>
            {category.name}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Store">
        <FilterChip href={href({ store: undefined })} active={!active.store}>
          All Stores
        </FilterChip>
        {stores.map((store) => (
          <FilterChip key={store.id} href={href({ store: store.slug })} active={active.store === store.slug}>
            {store.name}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Market">
        <FilterChip href={href({ market: undefined })} active={!active.market}>
          All Markets
        </FilterChip>
        {markets.map((market) => (
          <FilterChip key={market.slug} href={href({ market: market.slug })} active={active.market === market.slug}>
            {market.title}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Delivery">
        <FilterChip href={href({ free: active.free ? undefined : "1" })} active={Boolean(active.free)}>
          Free delivery
        </FilterChip>
        <FilterChip href={href({ sale: active.sale ? undefined : "1" })} active={Boolean(active.sale)}>
          On sale
        </FilterChip>
      </FilterGroup>
    </aside>
  );
}
