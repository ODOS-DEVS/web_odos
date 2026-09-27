import type { Metadata } from "next";
import type { ActiveFilters } from "@/components/product/product-filters";
import { ProductsView } from "@/components/product/products-view";
import { first } from "@/libs/url";
import { MOCK_CATEGORIES } from "@/mocks/catalog.mock";

function parseFilters(raw: Record<string, string | string[] | undefined>): ActiveFilters {
  return {
    q: first(raw.q)?.trim() || undefined,
    category: first(raw.category),
    store: first(raw.store),
    tag: first(raw.tag),
    free: first(raw.free),
    sort: first(raw.sort),
  };
}

const TAG_TITLE: Record<string, string> = { new: "New arrivals", popular: "Popular products", flash: "Flash deals" };

export async function generateMetadata({ searchParams }: PageProps<"/products">): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  if (filters.q) return { title: `Results for “${filters.q}”` };
  if (filters.tag && TAG_TITLE[filters.tag]) return { title: TAG_TITLE[filters.tag] };
  if (filters.category) {
    const name = MOCK_CATEGORIES.find((c) => c.slug === filters.category)?.name;
    if (name) return { title: name };
  }
  return { title: "All products" };
}

// `ProductsView` reads `mocks/` directly, so there is nothing to prefetch server-side for now.
export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const filters = parseFilters(await searchParams);
  return <ProductsView filters={filters} />;
}
