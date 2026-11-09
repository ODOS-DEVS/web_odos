import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { PromoTracker } from "@/components/tracking/track";
import type { PromoBanner } from "@/types/catalog";

/** Fallback card colours, used in turn when a banner has no `accent` of its own. */
export const PROMO_BACKGROUNDS = ["#383b46", "#16232b", "#3b3c3e", "#0f468d"];

export const promoBackground = (banner: PromoBanner, index: number) =>
  banner.accent ?? PROMO_BACKGROUNDS[index % PROMO_BACKGROUNDS.length];

/** Side-by-side deal cards from the admin-managed promo banners. Renders nothing when there are none. */
export function PromoBanners({ banners }: { banners: PromoBanner[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
      {banners.map((banner, index) => (
        <PromoTracker key={banner.id} entityType="promo_banner" entityId={banner.id} source="home">
          <PromoCard banner={banner} background={promoBackground(banner, index)} />
        </PromoTracker>
      ))}
    </div>
  );
}

function PromoCard({ banner, background }: { banner: PromoBanner; background: string }) {
  return (
    <Link
      href={banner.href}
      style={{ backgroundColor: background }}
      className="group grid min-h-36 grid-cols-[minmax(0,40%)_1fr] items-center gap-3 rounded-2xl p-3 touch-manipulation select-none transition-transform duration-300 ease-out active:scale-[0.99] sm:min-h-40 sm:grid-cols-[minmax(0,36%)_1fr] sm:gap-5 sm:rounded-3xl sm:p-4 md:grid-cols-[minmax(0,42%)_1fr] lg:min-h-52 lg:gap-6 hover:-translate-y-1"
    >
      <Media
        src={banner.imageUrl}
        name={banner.title}
        className="aspect-square w-full rounded-xl sm:rounded-2xl"
        imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
        sizes="(min-width: 1280px) 20vw, (min-width: 768px) 22vw, 38vw"
      />

      <div className="flex min-w-0 flex-col justify-center py-1 pr-1 sm:py-3 sm:pr-3 lg:py-6 lg:pr-4">
        {banner.subtitle && (
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#ea6734] min-[380px]:text-[10px] sm:mb-2 sm:text-xs">
            {banner.subtitle}
          </p>
        )}
        <h3 className="mb-2 text-base font-extrabold uppercase leading-tight text-white min-[380px]:text-lg sm:mb-4 sm:text-2xl lg:mb-6 lg:text-4xl">
          {banner.title}
        </h3>
        <span
          className={buttonStyles({
            size: "sm",
            className:
              "h-8 w-fit gap-1.5 rounded-full border-none bg-white/10 px-3 text-[11px] text-white transition-colors sm:h-9 sm:px-4 sm:text-xs lg:px-5 group-hover:bg-white/20",
          })}
        >
          {banner.ctaLabel}
          <ArrowRight className="size-3.5 text-[#ea6734] sm:size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
