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
      <Container className="grid min-h-[calc(100svh-10.5625rem)] grid-cols-1 items-center gap-8 py-8 min-[400px]:gap-10 min-[400px]:py-12 sm:py-16 md:min-h-[calc(100svh-14.0625rem)] md:grid-cols-[minmax(0,1fr)_minmax(17rem,0.8fr)] md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)] lg:gap-20 lg:py-20 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-16">
        <div className="rise-in max-w-xl">
          <p className="mb-3 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent-soft px-2.5 py-1.5 text-[10px] leading-tight font-medium text-accent min-[400px]:gap-2 min-[400px]:px-3 min-[400px]:text-xs">
            <Truck className="size-3.5" aria-hidden />
            Every vendor delivers their own part
          </p>
          <h1 className="text-[2rem] leading-[1.02] font-semibold tracking-[-0.03em] min-[360px]:text-4xl sm:text-5xl lg:text-[3.75rem] xl:text-[4.25rem]">
            One cart.
            <br />
            <span className="whitespace-nowrap text-accent">Every vendor.</span>
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-[1.55] text-muted min-[360px]:text-sm min-[360px]:leading-6 sm:text-base sm:leading-7">
            Fill a single basket from fashion boutiques, sneaker shops, bookstores and more. Check out once, then
            follow each vendor’s package on its own way to you.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-1.5 min-[320px]:gap-2 min-[360px]:mt-6 min-[360px]:flex min-[360px]:flex-wrap min-[360px]:gap-3">
            <ButtonLink href="/products" size="md" variant="primary" className="h-10 w-full gap-1 px-1.5 text-[11px] min-[320px]:gap-1.5 min-[320px]:text-xs min-[360px]:h-11 min-[360px]:w-auto min-[360px]:gap-2 min-[360px]:px-5 min-[360px]:text-sm">
              Start shopping
              <ArrowRight className="hidden size-3.5 shrink-0 min-[320px]:block min-[360px]:size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/stores" size="md" variant="outline" className="h-10 w-full px-1.5 text-[11px] min-[320px]:text-xs min-[360px]:h-11 min-[360px]:w-auto min-[360px]:px-5 min-[360px]:text-sm">
              Browse stores
            </ButtonLink>
          </div>
          <p className="mt-4 inline-flex items-start gap-2 text-[11px] leading-4 text-muted min-[400px]:mt-5 min-[400px]:text-xs sm:items-center sm:text-sm">
            <PackageCheck className="size-4 text-success" aria-hidden />
            Track every package separately, right up to your door
          </p>
        </div>

        <div
          className="rise-in mx-auto grid w-full max-w-md grid-cols-2 gap-2 min-[400px]:gap-3 sm:gap-4 lg:max-w-[34rem] xl:max-w-[39rem]"
          style={{ "--i": 2 } as CSSProperties}
        >
          {slots.map((category, index) => {
            const tile = (
              <>
                <Media
                  src={category?.imageUrl}
                  name={category?.name ?? "ODOS"}
                  priority
                  sizes="(min-width: 1280px) 15vw, (min-width: 1024px) 20vw, 45vw"
                  className="size-full"
                  imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                />
                {category && (
                  <div className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-black/75 px-2 py-1.5 text-white backdrop-blur-md min-[400px]:inset-x-2 min-[400px]:bottom-2 min-[400px]:rounded-xl min-[400px]:px-3 min-[400px]:py-2 sm:inset-x-3 sm:bottom-3 sm:rounded-2xl sm:px-4 sm:py-3">
                    <p className="truncate text-[11px] leading-tight font-semibold min-[400px]:text-xs sm:text-sm">{category.name}</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-white/75 min-[400px]:text-[10px] sm:text-xs">Shop now</p>
                  </div>
                )}
              </>
            );
            const box = cn(
              "group relative overflow-hidden rounded-xl bg-surface-muted min-[400px]:rounded-2xl sm:rounded-3xl",
              index === 2
                ? "col-span-2 aspect-2/1 sm:col-span-1 sm:col-start-2 sm:aspect-square"
                : "aspect-square",
            );
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
