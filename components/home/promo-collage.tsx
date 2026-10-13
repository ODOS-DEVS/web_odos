import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/libs/cn";
import { TILES, type Tile } from "@/mocks/home.mock";

export function PromoCollage() {
  const [hero, ...rest] = TILES;
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
      <PromoTileCard tile={hero} className="lg:min-h-115" />
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {rest.map((tile) => (
          <PromoTileCard key={tile.id} tile={tile} />
        ))}
      </div>
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
        <div className="relative aspect-square h-full min-h-0 w-full overflow-hidden rounded-xl sm:rounded-2xl lg:mb-5 lg:h-[60%] lg:min-h-60 lg:shrink-0 lg:aspect-auto">
          <Image
            src={tile.imageSrc}
            alt={tile.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
            sizes="(min-width: 1280px) 43vw, (min-width: 1024px) 46vw, 38vw"
          />
        </div>

        <div className="flex min-w-0 flex-grow flex-col justify-center pr-1 lg:justify-end lg:px-2 lg:pb-2">
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
              Shop this deal
              <ArrowRight className="size-4 text-[#ea6734]" aria-hidden />
            </span>
          </div>

          <h3 className="mb-1 text-lg font-extrabold uppercase leading-none tracking-tight text-white min-[380px]:text-2xl sm:text-3xl lg:mb-2 lg:text-[68px]">
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
              Shop this deal
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
      <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl lg:aspect-[5/4]">
        <Image
          src={tile.imageSrc}
          alt={tile.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 22vw, 38vw"
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center py-1 pr-1 sm:py-2 sm:pr-3 lg:pr-4">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#ea6734] min-[380px]:text-[10px] sm:mb-1.5 sm:text-xs">
          {tile.eyebrow}
        </p>
        <h3 className="mb-1 text-base font-extrabold uppercase leading-tight text-white min-[380px]:text-lg sm:mb-1.5 sm:text-xl lg:text-[28px]">
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
          Shop this deal
          <ArrowRight className="size-3.5 text-[#ea6734]" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
