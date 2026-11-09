import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { HydrationBoundary } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { dehydrated, getServerQueryClient } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";

export const metadata: Metadata = {
  title: "All categories",
  description: "Every category on ODOS, from fashion and electronics to groceries and hardware.",
};

export default async function CategoriesPage() {
  const queryClient = getServerQueryClient();
  // Fetched rather than prefetched: the heading counts them, so the page needs the value itself.
  const categories = await queryClient.fetchQuery(catalogQueries.categories());

  return (
    <HydrationBoundary state={dehydrated(queryClient)}>
      <Container className="py-8 sm:py-12">
        <header className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">All categories</h1>
          <p className="mt-2 text-muted">
            {categories.length} categories across every store on ODOS. Pick one to see what vendors are selling.
          </p>
        </header>

        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category, index) => (
            <li key={category.id} className="rise-in" style={{ "--i": Math.min(index, 8) } as CSSProperties}>
              <Link href={`/products?category=${category.slug}`} className="press group block">
                <div className="aspect-square overflow-hidden rounded-2xl">
                  <Media
                    src={category.imageUrl}
                    name={category.name}
                    className="size-full"
                    imgClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                  />
                </div>
                <p className="mt-2.5 font-medium">{category.name}</p>
                {category.subtitle && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{category.subtitle}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </HydrationBoundary>
  );
}
