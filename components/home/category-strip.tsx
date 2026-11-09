import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/types/catalog";
import { Media } from "@/components/ui/media";

const tileClass = "press group flex w-20 flex-col items-center gap-2.5 sm:w-24";
const circleClass = "size-20 rounded-full ring-2 ring-transparent transition-shadow duration-200 group-hover:ring-foreground sm:size-24";

/**
 * Categories as circular tiles. There are far more of them than fit a strip (33 at the time of
 * writing), so `limit` keeps the row short and a "View all" tile carries the rest to `/categories`.
 */
export function CategoryStrip({ categories, limit }: { categories: Category[]; limit?: number }) {
  const shown = limit ? categories.slice(0, limit) : categories;
  const hidden = categories.length - shown.length;

  return (
    <ul className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:gap-8 sm:px-0">
      {shown.map((category) => (
        <li key={category.id} className="shrink-0">
          <Link href={`/products?category=${category.slug}`} className={tileClass}>
            <Media src={category.imageUrl} name={category.name} sizes="96px" className={circleClass} />
            <span className="text-center text-sm font-medium">{category.name}</span>
          </Link>
        </li>
      ))}

      {hidden > 0 && (
        <li className="shrink-0">
          <Link href="/categories" className={tileClass}>
            <span
              className={`${circleClass} grid place-items-center bg-surface-muted text-muted transition-colors group-hover:text-foreground`}
            >
              <ArrowRight className="size-6" aria-hidden />
            </span>
            <span className="text-center text-sm font-medium">View all</span>
            <span className="sr-only">{hidden} more categories</span>
          </Link>
        </li>
      )}
    </ul>
  );
}
