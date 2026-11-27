"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { buttonStyles } from "@/components/ui/button";
import { useDealProducts, useProducts } from "@/hooks/use-catalog";
import { useRotatingWindow } from "@/hooks/use-rotating-window";
import { cn } from "@/libs/cn";
import { discountPercent, formatMoney } from "@/libs/format";
import { TILE_BACKGROUNDS, type Tile } from "@/libs/home-editorial";
import type { Product } from "@/types/catalog";

/** One hero plus two rows. The deals query returns up to 12, so this is a page of them. */
const TILE_COUNT = 3;

function toTile(product: Product, index: number): Tile {
  const off = discountPercent(product.price, product.compareAtPrice);
  return {
    id: product.id,
    href: `/products/${product.id}`,
    // Only a real markdown is called one. A full-price product topping the
    // collage up says "NEW IN" instead -- labelling it a deal would be a
    // discount the shopper cannot actually get.
    eyebrow: off ? `${off}% OFF` : "NEW IN",
    cta: off ? "Shop this deal" : "Shop now",
    title: product.name,
    price: formatMoney(product.price),
    originalPrice: product.compareAtPrice ? formatMoney(product.compareAtPrice) : "",
    imageSrc: product.images[0] ?? "",
    bgClass: TILE_BACKGROUNDS[index % TILE_BACKGROUNDS.length],
    layout: index === 0 ? "hero" : "row",
  };
}

/**
 * The discounted-product collage on the home page.
 *
 * Two things were wrong with it on a desktop screen, both visible side by side
 * with the mobile layout that was fine:
 *
 * - The hero's title was a flat 68px. A two-word product name fitted; "Classic
 *   Men Sleeves" wrapped to two lines, pushed the price past the bottom of the
 *   card and clipped it. The title is fluid now and capped at two lines, and
 *   the card is a column where the image is the part that gives way — so the
 *   price can never be the thing that gets pushed out.
 * - The right column stretched whatever it held to the hero's full height, so
 *   with only one row tile the page showed a 460px slab of flat colour. It now
 *   asks for two row tiles and only falls back to one when the catalogue
 *   genuinely has nothing else discounted.
 *
 * And it no longer shows the same three products forever: the query already
 * returned twelve, of which nine were never rendered. It now pages through all
 * of them, pausing whenever someone is actually looking at it.
 */
export function PromoCollage() {
  const { data } = useDealProducts();
  const deals = useMemo(() => data ?? [], [data]);

  // Only fetched when the markdowns alone cannot fill the collage, which is
  // most of the time: the catalogue currently carries two discounted products,
  // so the strip rendered one hero beside a single stretched tile and had
  // nothing to rotate through.
  const needsTopUp = deals.length > 0 && deals.length < TILE_COUNT * 2;
  const { data: recent } = useProducts({ limit: 12, max_age_days: 45 });

  const pool = useMemo(() => {
    if (!needsTopUp) return deals;
    const seen = new Set(deals.map((product) => product.id));
    const extra = (recent ?? []).filter((product) => !seen.has(product.id));
    return [...deals, ...extra];
  }, [deals, recent, needsTopUp]);

  const { page, pageIndex, pageCount, goTo, pauseHandlers } = useRotatingWindow(
    pool,
    TILE_COUNT,
  );

  // A final page with one item would rotate into a half-empty collage, so fall
  // back to the top of the list to fill it.
  const filled = page.length === TILE_COUNT ? page : pool.slice(0, TILE_COUNT);
  const tiles = filled.map(toTile);

  // The page after this one, rendered as hidden preloads. Without it every
  // rotation starts with an empty frame while the next photo downloads, which
  // is the one thing that makes an automatic carousel feel broken.
  const upcoming = useMemo(() => {
    if (pageCount < 2) return [];
    const next = (pageIndex + 1) % pageCount;
    return pool
      .slice(next * TILE_COUNT, next * TILE_COUNT + TILE_COUNT)
      .map((product) => product.images[0])
      .filter(Boolean);
  }, [pool, pageIndex, pageCount]);

  if (tiles.length === 0) return null;

  const [hero, ...rest] = tiles;

  return (
    <div {...pauseHandlers}>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        {/* Keyed by product: without it React reuses the <img> across a
            rotation and the browser keeps painting the old photo until the
            new one decodes, so the hero showed a shirt captioned "Aqua Rich
            Brightening Body Oil". */}
        <PromoTileCard key={hero.id} tile={hero} className="lg:min-h-115" />
        {rest.length > 0 && (
          // auto-rows-fr so two tiles split the hero's height evenly; with one
          // the row sizes to its content instead of stretching into a slab.
          <div
            className={cn(
              "grid grid-cols-1 gap-3 sm:gap-4",
              rest.length > 1 && "lg:auto-rows-fr",
            )}
          >
            {rest.map((tile) => (
              <PromoTileCard key={tile.id} tile={tile} />
            ))}
          </div>
        )}
      </div>

      {upcoming.length > 0 && (
        <div aria-hidden className="pointer-events-none absolute size-0 overflow-hidden">
          {upcoming.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- a 1px warm-up, not a rendered image.
            <img key={src} src={src} alt="" width={1} height={1} loading="eager" decoding="async" />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show deals ${index + 1} of ${pageCount}`}
              aria-current={index === pageIndex ? "true" : undefined}
              className={cn(
                "press h-1.5 rounded-full transition-all duration-300",
                index === pageIndex
                  ? "w-6 bg-accent"
                  : "w-1.5 bg-line hover:bg-muted",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PromoTileCard({ tile, className }: { tile: Tile; className?: string }) {
  if (tile.layout === "hero") {
    return (
      <Link
        href={tile.href}
        className={cn(
          "group grid min-h-36 grid-cols-[minmax(0,40%)_1fr] gap-3 rounded-2xl p-3 touch-manipulation select-none transition-transform duration-300 ease-out active:scale-[0.99] sm:min-h-44 sm:grid-cols-[minmax(0,36%)_1fr] sm:gap-5 sm:rounded-3xl sm:p-4 lg:flex lg:flex-col lg:gap-0 hover:-translate-y-1",
          tile.bgClass,
          className,
        )}
      >
        {/* On desktop the image takes the slack (`flex-1 min-h-0`) so a long
            title lengthens the card's text block rather than overflowing it.

            `object-contain` rather than `cover`: vendors upload whatever shape
            their camera gave them, and cropping to fill was cutting the tops
            off garments and the ends off bottles. The pale backdrop is what
            makes containing look deliberate instead of letterboxed, and it
            stays legible whichever tile colour this card drew. */}
        <div className="relative aspect-square h-full min-h-0 w-full overflow-hidden rounded-xl bg-white/[0.07] sm:rounded-2xl lg:mb-5 lg:aspect-auto lg:h-auto lg:min-h-48 lg:flex-1">
          <Image
            src={tile.imageSrc}
            alt={tile.title}
            fill
            className="object-contain object-center p-2 transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none sm:p-3"
            sizes="(min-width: 1280px) 43vw, (min-width: 1024px) 46vw, 38vw"
          />
        </div>

        <div className="flex min-w-0 flex-grow flex-col justify-center pr-1 lg:flex-grow-0 lg:shrink-0 lg:justify-end lg:px-2 lg:pb-2">
          <div className="mb-1 flex items-center justify-between sm:mb-2 lg:mb-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#ea6734] min-[380px]:text-[10px] sm:text-xs lg:text-sm">
              {tile.eyebrow}
            </p>
            <span
              className={buttonStyles({
                size: "sm",
                className: "hidden lg:flex w-fit gap-2 rounded-full border-none bg-white/10 text-white px-4 transition-colors group-hover:bg-white/20",
              })}
            >
              {tile.cta}
              <ArrowRight className="size-4 text-[#ea6734]" aria-hidden />
            </span>
          </div>

          {/* Fluid rather than a fixed 68px, and never more than two lines:
              that combination is what used to push the price off the card. */}
          <h3 className="mb-1 line-clamp-2 text-lg font-extrabold uppercase leading-[1.05] tracking-tight text-white min-[380px]:text-2xl sm:text-3xl lg:mb-2 lg:text-[clamp(2rem,3.4vw,3.75rem)]">
            {tile.title}
          </h3>

          <div className="flex flex-col items-start gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 lg:gap-3">
              <span className="text-sm font-bold text-white sm:text-lg lg:text-2xl">{tile.price}</span>
              <span className="text-[11px] text-white/50 line-through decoration-1 sm:text-sm lg:text-base">{tile.originalPrice}</span>
            </div>
            <span
              className={buttonStyles({
                size: "sm",
                className: "flex h-8 w-fit gap-1.5 rounded-full border-none bg-white/10 px-3 text-[11px] text-white transition-colors sm:h-9 sm:px-4 sm:text-xs lg:hidden group-hover:bg-white/20",
              })}
            >
              {tile.cta}
              <ArrowRight className="size-3.5 text-[#ea6734] sm:size-4" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={tile.href}
      className={cn(
        "group grid min-h-36 grid-cols-[minmax(0,40%)_1fr] items-center gap-3 rounded-2xl p-3 touch-manipulation select-none transition-transform duration-300 ease-out active:scale-[0.99] sm:min-h-44 sm:grid-cols-[minmax(0,36%)_1fr] sm:gap-5 sm:rounded-3xl sm:p-4 lg:h-full lg:grid-cols-[minmax(0,45%)_1fr] lg:gap-6 hover:-translate-y-1",
        tile.bgClass,
        className
      )}
    >
      {/* Square at every width. The 5/4 desktop crop meant the same product
          was framed differently on a phone and a laptop, and tall bottles lost
          their caps on one of them. */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/[0.07] sm:rounded-2xl">
        <Image
          src={tile.imageSrc}
          alt={tile.title}
          fill
          className="object-contain object-center p-2 transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none sm:p-3"
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 22vw, 38vw"
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center py-1 pr-1 sm:py-2 sm:pr-3 lg:pr-4">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#ea6734] min-[380px]:text-[10px] sm:mb-1.5 sm:text-xs">
          {tile.eyebrow}
        </p>
        <h3 className="mb-1 line-clamp-2 text-base font-extrabold uppercase leading-tight text-white min-[380px]:text-lg sm:mb-1.5 sm:text-xl lg:text-[clamp(1.1rem,1.6vw,1.75rem)]">
          {tile.title}
        </h3>
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:mb-4">
          <span className="text-sm font-bold text-white sm:text-base lg:text-lg">{tile.price}</span>
          <span className="text-[11px] text-white/50 line-through decoration-1 sm:text-sm">{tile.originalPrice}</span>
        </div>
        <span
          className={buttonStyles({
            size: "sm",
            className: "h-8 w-fit gap-1.5 rounded-full border-none bg-white/10 px-3 py-1.5 text-[11px] text-white transition-colors sm:h-9 sm:px-4 sm:text-xs group-hover:bg-white/20",
          })}
        >
          {tile.cta}
          <ArrowRight className="size-3.5 text-[#ea6734]" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
