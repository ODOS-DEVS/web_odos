import type { CSSProperties } from "react";
import type { Product, Store } from "@/types/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";

// Mirrors `:root[data-theme="dark"]` in app/globals.css — this card stays dark in both site themes,
// so it reuses the dark palette's own values rather than inventing a second one.
const darkPalette = {
  "--background": "#12110e",
  "--surface": "#1b1a16",
  "--surface-muted": "#24221d",
  "--foreground": "#f2efe7",
  "--muted": "#a19c90",
  "--line": "#33302a",
  "--accent": "#ff7a45",
  "--accent-foreground": "#16140f",
  "--accent-soft": "#3a2116",
} as CSSProperties;

/** Deal products on a card that's always dark, regardless of the site's own light/dark theme. */
export function BestDeals({ products, stores }: { products: Product[]; stores?: Map<string, Store> }) {
  if (products.length === 0) return null;

  return (
    <div style={darkPalette} className="rounded-3xl bg-background text-foreground">
      <SectionHeading title="Best deals" href="/products?tag=flash" />
      <ProductGrid products={products.slice(0, 4)} stores={stores} />
    </div>
  );
}
