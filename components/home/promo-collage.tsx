import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/libs/cn";
import { TILES, type Tile } from "@/mocks/home.mock";

export function PromoCollage() {
  const [hero, ...rest] = TILES;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PromoTileCard tile={hero} className="min-h-[460px]" />
      <div className="grid grid-cols-1 gap-4">
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
      <div className={cn("flex flex-col rounded-3xl p-4", tile.bgClass, className)}>
        <div className="relative w-full h-56 sm:h-[60%] min-h-[240px] shrink-0 overflow-hidden rounded-2xl mb-4 sm:mb-5">
          <Image
            src={tile.imageSrc}
            alt={tile.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        
        <div className="flex flex-col justify-end flex-grow px-2 pb-2">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold uppercase tracking-wider text-[#ea6734]">
              {tile.eyebrow}
            </p>
            <ButtonLink
              href={tile.href}
              size="sm"
              className="hidden sm:flex w-fit gap-2 rounded-full border-none bg-white/10 text-white hover:bg-white/20 px-4 transition-colors"
            >
              Shop this deal
              <ArrowRight className="size-4 text-[#ea6734]" aria-hidden />
            </ButtonLink>
          </div>
          
          <h3 className="text-5xl sm:text-[68px] font-extrabold uppercase text-white mb-2 leading-none tracking-tight">
            {tile.title}
          </h3>
          
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-bold text-white">{tile.price}</span>
              <span className="text-base text-white/50 line-through decoration-1">{tile.originalPrice}</span>
            </div>
            <ButtonLink
              href={tile.href}
              size="sm"
              className="sm:hidden flex w-fit gap-2 rounded-full border-none bg-white/10 text-white hover:bg-white/20 px-4 transition-colors"
            >
              Shop this deal
              <ArrowRight className="size-4 text-[#ea6734]" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 rounded-3xl h-full",
        tile.bgClass,
        className
      )}
    >
      <div className="relative w-full sm:w-[45%] aspect-[4/3] sm:aspect-[5/4] shrink-0 overflow-hidden rounded-2xl">
        <Image
          src={tile.imageSrc}
          alt={tile.title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 25vw, 50vw"
        />
      </div>

      <div className="flex flex-col justify-center py-2 pr-2 sm:pr-4 w-full">
        <p className="text-xs font-bold uppercase tracking-wider text-[#ea6734] mb-1.5">
          {tile.eyebrow}
        </p>
        <h3 className="text-2xl sm:text-[28px] font-extrabold uppercase text-white mb-1.5">
          {tile.title}
        </h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base sm:text-lg font-bold text-white">{tile.price}</span>
          <span className="text-sm text-white/50 line-through decoration-1">{tile.originalPrice}</span>
        </div>
        <ButtonLink
          href={tile.href}
          size="sm"
          className="w-fit gap-1.5 rounded-full border-none bg-white/10 text-white hover:bg-white/20 px-4 py-1.5 transition-colors text-xs"
        >
          Shop this deal
          <ArrowRight className="size-3.5 text-[#ea6734]" aria-hidden />
        </ButtonLink>
      </div>
    </div>
  );
}
