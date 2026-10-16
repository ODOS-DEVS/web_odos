import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Media } from "@/components/ui/media";

const mosaic = [
  { src: "/auth/mosaic-watch.jpg", alt: "Apple Watch Ultra" },
  { src: "/auth/mosaic-shoe.jpg", alt: "Basketball sneaker" },
  { src: "/auth/mosaic-controller.jpg", alt: "Game controller" },
  { src: "/auth/mosaic-top.jpg", alt: "Knit top on a hanger" },
  { src: "/auth/mosaic-headphones.jpg", alt: "Woman wearing headphones" },
  { src: "/auth/mosaic-books.jpg", alt: "Stack of books with glasses" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight" aria-label="ODOS home">
            odos<span className="text-accent">.</span>
          </Link>
          <ThemeToggle />
        </div>
        <main className="grid flex-1 place-items-center py-12">{children}</main>
      </div>

      <aside className="relative hidden overflow-hidden bg-surface-muted p-12 lg:flex lg:flex-col lg:justify-between" aria-hidden>
        <div className="grid grid-cols-3 gap-4">
          {mosaic.map((tile, index) => (
            <Media
              key={tile.src}
              src={tile.src}
              alt={tile.alt}
              name={tile.alt}
              sizes="20vw"
              className={`rounded-3xl ${index % 2 === 0 ? "aspect-3/4" : "aspect-square"}`}
            />
          ))}
        </div>
        <p className="max-w-sm text-2xl leading-snug font-semibold">
          One cart, every vendor. Track each package on its way to you.
        </p>
      </aside>
    </div>
  );
}
