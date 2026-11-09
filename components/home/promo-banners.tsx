"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { usePromoBanners } from "@/hooks/use-catalog";
import { cn } from "@/libs/cn";
import type { PromoBanner } from "@/types/catalog";

/**
 * Merchandising banners the team schedules in the admin. The section hides itself when nothing is
 * scheduled rather than showing filler, so an empty board looks deliberate instead of broken.
 */
export function PromoBanners() {
  const { data, isPending } = usePromoBanners();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="min-h-36 animate-pulse rounded-2xl bg-surface-muted sm:min-h-40 sm:rounded-3xl lg:min-h-52" />
        ))}
      </div>
    );
  }

  if (!data?.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
      {data.map((promo) => (
        <PromoCard key={promo.id} promo={promo} />
      ))}
    </div>
  );
}

function PromoCard({ promo }: { promo: PromoBanner }) {
  return (
    <Link
      href={promo.ctaHref}
      className={cn(
        "group grid min-h-36 grid-cols-[minmax(0,40%)_1fr] items-center gap-3 rounded-2xl bg-surface-muted p-3 touch-manipulation select-none transition-transform duration-300 ease-out active:scale-[0.99] sm:min-h-40 sm:grid-cols-[minmax(0,36%)_1fr] sm:gap-5 sm:rounded-3xl sm:p-4 md:grid-cols-[minmax(0,42%)_1fr] lg:min-h-52 lg:gap-6 hover:-translate-y-1",
      )}
      // The accent is vendor-supplied, so it is applied as a style rather than a Tailwind class.
      style={promo.accent ? { backgroundColor: promo.accent } : undefined}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl">
        <Media
          src={promo.imageUrl}
          name={promo.title}
          className="size-full"
          imgClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 22vw, 38vw"
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center py-1 pr-1 sm:py-3 sm:pr-3 lg:py-6 lg:pr-4">
        <h3 className="mb-1 text-base font-extrabold uppercase leading-tight text-white min-[380px]:text-lg sm:mb-2 sm:text-2xl lg:text-4xl">
          {promo.title}
        </h3>
        {promo.subtitle && (
          <p className="mb-2 text-[11px] text-white/70 sm:mb-4 sm:text-sm lg:mb-6 lg:text-base">{promo.subtitle}</p>
        )}
        <span
          className={buttonStyles({
            size: "sm",
            className:
              "h-8 w-fit gap-1.5 rounded-full border-none bg-white/10 px-3 text-[11px] text-white transition-colors sm:h-9 sm:px-4 sm:text-xs lg:px-5 group-hover:bg-white/20",
          })}
        >
          {promo.ctaLabel}
          <ArrowRight className="size-3.5 text-[#ea6734] sm:size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
