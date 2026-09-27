import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ContactUsButton } from "@/components/layout/contact-drawer";
import CONFIG from "@/utils/config";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?tag=flash", label: "Flash deals" },
      { href: "/products?tag=new", label: "New arrivals" },
      { href: "/stores", label: "Stores" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Create an account" },
      { href: "/orders", label: "Track an order" },
      { href: "/cart", label: "Cart" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface-muted/60">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            odos<span className="text-accent">.</span>
          </Link>
          <p className="mt-3 text-sm leading-6 text-muted">
            Shop from many local vendors and check out once. Each vendor packs and delivers their
            own part of your order, so you always know who is bringing what.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold">{column.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted">
          <span>
            © {new Date().getUTCFullYear()} {CONFIG.SITE_NAME}. All rights reserved.
          </span>
          <ContactUsButton />
        </Container>
      </div>
    </footer>
  );
}
