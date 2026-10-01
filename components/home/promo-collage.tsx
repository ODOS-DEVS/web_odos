import { ButtonLink } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";

type Tile = {
  id: string;
  href: string;
  eyebrow: string;
  emphasis: string;
  title: string;
  imageSeed: string;
  bg: string;
  layout: "full-bleed" | "half-image";
  align?: "center" | "top";
};

const TILES: Tile[] = [
  {
    id: "smart-watch",
    href: "/products?tag=flash",
    eyebrow: "Sell On",
    emphasis: "35% Off",
    title: "Smart Watch",
    imageSeed: "odos-collage-shopping",
    bg: "#1a1a1a",
    layout: "full-bleed",
    align: "center",
  },
  {
    id: "winter-collection",
    href: "/products?tag=flash",
    eyebrow: "Sell On",
    emphasis: "42% Off",
    title: "Winter Collection",
    imageSeed: "odos-collage-winter-watch",
    bg: "#0d3240",
    layout: "half-image",
    align: "top",
  },
  {
    id: "kids-fashion",
    href: "/products?category=fashion",
    eyebrow: "New Collection",
    emphasis: "",
    title: "Kid's Fashion",
    imageSeed: "odos-collage-kids-fashion",
    bg: "#f3f1ea",
    layout: "half-image",
    align: "top",
  },
];

/** A tall hero tile beside two stacked half-image tiles — a second promo collage, denser than `PromoBanners`. */
export function PromoCollage() {
  const [hero, ...rest] = TILES;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PromoTileCard tile={hero} className="min-h-80 lg:min-h-0" />
      <div className="grid grid-cols-1 gap-4">
        {rest.map((tile) => (
          <PromoTileCard key={tile.id} tile={tile} className="min-h-48" />
        ))}
      </div>
    </div>
  );
}

function PromoTileCard({ tile, className }: { tile: Tile; className?: string }) {
  const light = tile.bg === "#f3f1ea";
  const textTone = light ? "text-[#16140f]" : "text-white";

  return (
    <div
      className={cn("relative isolate overflow-hidden rounded-3xl", className)}
      style={{ backgroundColor: tile.bg }}
    >
      {tile.layout === "full-bleed" ? (
        <>
          <Media src={`https://picsum.photos/seed/${tile.imageSeed}/1000/1200`} name={tile.title} className="absolute inset-0 size-full" />
          <div className="absolute inset-0 bg-black/45" />
        </>
      ) : (
        <div className="absolute inset-y-0 right-0 w-[55%]">
          <Media src={`https://picsum.photos/seed/${tile.imageSeed}/800/800`} name={tile.title} className="size-full" sizes="(min-width: 1024px) 25vw, 50vw" />
          <div
            className="absolute inset-0 bg-linear-to-r"
            style={{ backgroundImage: `linear-gradient(to right, ${tile.bg}, ${tile.bg}1a, transparent)` }}
          />
        </div>
      )}

      <div
        className={cn(
          "relative z-10 flex h-full max-w-[70%] flex-col gap-3 p-6 sm:p-8",
          tile.align === "center" ? "justify-center" : "justify-start",
        )}
      >
        <p className={cn("text-base font-medium sm:text-lg", light ? "text-[#16140f]/80" : "text-white/90")}>
          {tile.eyebrow}
          {tile.emphasis && <span className="font-semibold text-[#4da3ff]"> {tile.emphasis}</span>}
        </p>
        <h3 className={cn("text-2xl leading-tight font-semibold sm:text-3xl", textTone)}>{tile.title}</h3>
        <ButtonLink
          href={tile.href}
          size="sm"
          variant="outline"
          className={cn(
            "mt-1 w-fit text-xs tracking-wide uppercase",
            light
              ? "border-[#16140f]/30 bg-transparent text-[#16140f] hover:border-[#16140f] hover:bg-[#16140f]/5"
              : "border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10",
          )}
        >
          Shop now
        </ButtonLink>
      </div>
    </div>
  );
}
