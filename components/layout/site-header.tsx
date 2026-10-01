import Link from "next/link";
import { Container } from "@/components/ui/container";
import { AccountMenu } from "./account-menu";
import { CartButton } from "./cart-button";
import { CategoryNav } from "./category-nav";
import { FavoritesButton } from "./favorites-button";
import { SearchForm } from "./search-form";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    // Translucent chrome: content scrolls underneath a blurred layer instead of an opaque bar.
    <header className="sticky top-0 z-40 short:static border-b border-line bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <Container className="flex h-16 items-center gap-3 sm:gap-6">
        <Link href="/" className="text-2xl font-bold tracking-tight" aria-label="ODOS home">
          odos<span className="text-accent">.</span>
        </Link>

        <SearchForm className="mx-auto hidden max-w-xl flex-1 md:block" />

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <AccountMenu />
          <ThemeToggle />
          <FavoritesButton />
          <CartButton />
        </div>
      </Container>

      <Container className="pb-3 md:hidden">
        <SearchForm />
      </Container>

      <nav aria-label="Browse" className="border-t border-line/60">
        <Container className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2">
          <CategoryNav />
        </Container>
      </nav>
    </header>
  );
}
