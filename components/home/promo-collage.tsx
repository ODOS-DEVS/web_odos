import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";
import type { PromoBanner } from "@/types/catalog";
import { promoBackground } from "./promo-banners";

/** One large deal tile beside a stack of smaller ones, from the admin-managed promo banners. */
export function PromoCollage({ banners }: { banners: PromoBanner[] }) {
  if (banners.length === 0) return null;
  const [hero, ...rest] = banners;

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:gap-4", rest.length > 0 && "lg:grid-cols-2")}>
      <HeroTile banner={hero} background={promoBackground(hero, 2)} className="lg:min-h-115" />
      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {rest.map((banner, index) => (
            <RowTile key={banner.id} banner={banner} background={promoBackground(banner, index + 3)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CtaPill({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={buttonStyles({
        size: "sm",
        className: cn(
          "h-8 w-fit gap-1.5 rounded-full border-none bg-white/10 px-3 text-[11px] text-white transition-colors sm:h-9 sm:px-4 sm:text-xs group-hover:bg-white/20",
          className,
        ),
      })}
    >
      {label}
      <ArrowRight className="size-3.5 text-[#ea6734] sm:size-4" aria-hidden />
    </span>
  );
}

function HeroTile({ banner, background, className }: { banner: PromoBanner; background: string; className?: string }) {
  return (
    <Link
      href={banner.href}
      style={{ backgroundColor: background }}
      className={cn(
        "group grid min-h-36 grid-cols-[minmax(0,40%)_1fr] gap-3 rounded-2xl p-3 touch-manipulation select-none transition-transform duration-300 ease-out active:scale-[0.99] sm:min-h-44 sm:grid-cols-[minmax(0,36%)_1fr] sm:gap-5 sm:rounded-3xl sm:p-4 lg:flex lg:flex-col lg:gap-0 hover:-translate-y-1",
        className,
      )}
    >
      <Media
        src={banner.imageUrl}
        name={banner.title}
        className="aspect-square h-full min-h-0 w-full rounded-xl sm:rounded-2xl lg:mb-5 lg:aspect-auto lg:h-[60%] lg:min-h-60 lg:shrink-0"
        imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
        sizes="(min-width: 1280px) 43vw, (min-width: 1024px) 46vw, 38vw"
      />

      <div className="flex min-w-0 grow flex-col justify-center pr-1 lg:justify-end lg:px-2 lg:pb-2">
        <div className="mb-1 flex items-center justify-between sm:mb-2 lg:mb-3">
          {banner.subtitle && (
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#ea6734] min-[380px]:text-[10px] sm:text-xs lg:text-sm">
              {banner.subtitle}
            </p>
          )}
          <CtaPill label={banner.ctaLabel} className="hidden lg:flex lg:px-4" />
        </div>
        <h3 className="mb-2 text-lg font-extrabold uppercase leading-none tracking-tight text-white min-[380px]:text-2xl sm:text-3xl lg:mb-0 lg:text-[68px]">
          {banner.title}
        </h3>
        <CtaPill label={banner.ctaLabel} className="flex lg:hidden" />
      </div>
    </Link>
  );
}

function RowTile({ banner, background }: { banner: PromoBanner; background: string }) {
  return (
    <Link
      href={banner.href}
      style={{ backgroundColor: background }}
      className="group grid min-h-36 grid-cols-[minmax(0,40%)_1fr] items-center gap-3 rounded-2xl p-3 touch-manipulation select-none transition-transform duration-300 ease-out active:scale-[0.99] sm:min-h-44 sm:grid-cols-[minmax(0,36%)_1fr] sm:gap-5 sm:rounded-3xl sm:p-4 lg:h-full lg:grid-cols-[minmax(0,45%)_1fr] lg:gap-6 hover:-translate-y-1"
    >
      <Media
        src={banner.imageUrl}
        name={banner.title}
        className="aspect-square w-full rounded-xl sm:rounded-2xl lg:aspect-[5/4]"
        imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 22vw, 38vw"
      />

      <div className="flex min-w-0 flex-col justify-center py-1 pr-1 sm:py-2 sm:pr-3 lg:pr-4">
        {banner.subtitle && (
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#ea6734] min-[380px]:text-[10px] sm:mb-1.5 sm:text-xs">
            {banner.subtitle}
          </p>
        )}
        <h3 className="mb-2 text-base font-extrabold uppercase leading-tight text-white min-[380px]:text-lg sm:mb-4 sm:text-xl lg:text-[28px]">
          {banner.title}
        </h3>
        <CtaPill label={banner.ctaLabel} />
      </div>
    </Link>
  );
}
