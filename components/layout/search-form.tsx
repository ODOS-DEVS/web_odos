import { Search } from "lucide-react";
import { cn } from "@/libs/cn";

/** Plain GET form so search works without JavaScript and is crawlable. */
export function SearchForm({ className, defaultValue }: { className?: string; defaultValue?: string }) {
  return (
    <form action="/products" role="search" className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search products and stores"
        aria-label="Search products and stores"
        className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-base transition-colors sm:text-sm duration-150 placeholder:text-muted hover:border-foreground/40 focus:border-foreground focus:outline-none"
      />
    </form>
  );
}
