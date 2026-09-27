"use client";

import Link from "next/link";
import { MOCK_CATEGORIES } from "@/mocks/catalog.mock";

const linkClass =
  "press shrink-0 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-muted hover:text-foreground";

const primaryLinks = [
  { href: "/products", label: "All products" },
  { href: "/products?tag=flash", label: "Deals" },
  { href: "/stores", label: "Stores" },
  { href: "/orders", label: "Orders" },
];

/** Browse row: fixed links plus the live category list (prefetched in the layout, so it renders in the server HTML). */
export function CategoryNav() {
  const categories = MOCK_CATEGORIES;

  return (
    <>
      {primaryLinks.map((link) => (
        <Link key={link.href} href={link.href} className={`${linkClass} font-medium text-foreground`}>
          {link.label}
        </Link>
      ))}
      {categories.length > 0 && <span className="mx-2 h-4 w-px shrink-0 bg-line" aria-hidden />}
      {categories.map((category) => (
        <Link key={category.id} href={`/products?category=${category.slug}`} className={linkClass}>
          {category.name}
        </Link>
      ))}
    </>
  );
}
