import Link from "next/link";
import type { Category } from "@/types/catalog";
import { Media } from "@/components/ui/media";

const tileClass = "press group flex w-20 flex-col items-center gap-2.5 sm:w-24";
const circleClass = "size-20 rounded-full ring-2 ring-transparent transition-shadow duration-200 group-hover:ring-foreground sm:size-24";

/**
 * Categories as circular tiles in one horizontal, touch-scrollable row.
 */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:mx-0 sm:gap-8 sm:px-0">
      {categories.map((category) => (
        <li key={category.id} className="shrink-0">
          <Link href={`/products?category=${category.slug}`} className={`${tileClass} snap-start`}>
            <Media src={category.imageUrl} name={category.name} sizes="96px" className={circleClass} />
            <span className="text-center text-sm font-medium">{category.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
