"use client";

import Link from "next/link";

const linkClass =
  "press shrink-0 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-muted hover:text-foreground";

const primaryLinks = [
  { href: "/products", label: "All products" },
  { href: "/products?tag=flash", label: "Deals" },
  { href: "/stores", label: "Stores" },
  { href: "/market", label: "Market" },
  { href: "/orders", label: "Orders" },
];

const secondaryLinks = [
  { href: "/products", label: "Category" },
  { href: "#", label: "Resources" },
];

/** Browse row: fixed product/store links, then a divider, then category/resource links. */
export function CategoryNav() {
  return (
    <>
      {primaryLinks.map((link) => (
        <Link key={link.href} href={link.href} className={`${linkClass} font-medium text-foreground`}>
          {link.label}
        </Link>
      ))}
      <span className="mx-2 h-4 w-px shrink-0 bg-line" aria-hidden />
      {secondaryLinks.map((link) => (
        <Link key={link.label} href={link.href} className={linkClass}>
          {link.label}
        </Link>
      ))}
    </>
  );
}
