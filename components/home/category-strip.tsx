import Link from "next/link";
import type { Category } from "@/types/catalog";
import { Media } from "@/components/ui/media";

export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:gap-8 sm:px-0">
      {categories.map((category) => (
        <li key={category.id} className="shrink-0">
          <Link
            href={`/products?category=${category.slug}`}
            className="press group flex w-20 flex-col items-center gap-2.5 sm:w-24"
          >
            <Media
              src={category.imageUrl}
              name={category.name}
              sizes="96px"
              className="size-20 rounded-full ring-2 ring-transparent transition-shadow duration-200 group-hover:ring-foreground sm:size-24"
            />
            <span className="text-center text-sm font-medium">{category.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
