"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, PackageCheck, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";
import { MOCK_CATEGORIES } from "@/mocks/catalog.mock";

/** Hero copy plus a tile collage built from the live category photos (gradient tiles until they load). */
export function Hero() {
  const categories = MOCK_CATEGORIES;
  const tiles = categories.slice(0, 3);
  // Keep the collage shape even before data arrives.
  const slots = [0, 1, 2].map((i) => tiles[i]);

  return (
    <section className="overflow-hidden border-b border-line">
      <Container className="grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:py-20">
        <div className="rise-in">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
            <Truck className="size-3.5" aria-hidden />
            Every vendor delivers their own part
          </p>
          <h1 className="text-5xl leading-[1.02] font-semibold sm:text-6xl lg:text-7xl">
            One cart.
            <br />
            <span className="text-accent">Every vendor.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
            Fill a single basket from fashion boutiques, sneaker shops, bookstores and more. Check out once, then
            follow each vendor’s package on its own way to you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/products" size="lg" variant="primary">
              Start shopping
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/stores" size="lg" variant="outline">
              Browse stores
            </ButtonLink>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted">
            <PackageCheck className="size-4 text-success" aria-hidden />
            Track every package separately, right up to your door
          </p>
        </div>

        <div
          className="rise-in mx-auto grid w-full max-w-xl grid-cols-2 gap-3 sm:gap-4 lg:max-w-none"
          style={{ "--i": 2 } as CSSProperties}
        >
          {slots.map((category, index) => {
            const hero = index === 0;
            const tile = (
              <>
                <Media
                  src={category?.imageUrl}
                  name={category?.name ?? "ODOS"}
                  priority
                  sizes="(min-width: 1024px) 30vw, 45vw"
                  className="size-full"
                  imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                />
                {category && (
                  <div className="absolute inset-x-3 bottom-3 rounded-xl bg-surface/90 px-3 py-2 text-xs backdrop-blur-md">
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-muted">Shop now</p>
                  </div>
                )}
              </>
            );
            const box = cn("group relative overflow-hidden rounded-3xl bg-surface-muted", hero ? "col-span-1 row-span-2 min-h-72" : "col-span-1 aspect-square");
            return category ? (
              <Link key={category.id} href={`/products?category=${category.slug}`} className={box}>
                {tile}
              </Link>
            ) : (
              <div key={index} className={box} aria-hidden>
                {tile}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
