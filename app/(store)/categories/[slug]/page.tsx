import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { CategoryLanding } from "@/components/category/category-landing";
import { dehydrated, getServerQueryClient, prefetchAll } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // Shares the per-request query client with the page body, so the title costs no extra request.
  const categories = await getServerQueryClient().fetchQuery(catalogQueries.categories());
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description: category.subtitle || `Shop ${category.name.toLowerCase()} from local vendors on ODOS.`,
  };
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const queryClient = getServerQueryClient();
  await prefetchAll(queryClient, catalogQueries.categories(), catalogQueries.products(), catalogQueries.stores());

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <CategoryLanding slug={slug} />
    </HydrationBoundary>
  );
}
