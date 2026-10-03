import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/libs/cn";
import { PROMOS, type Promo } from "@/mocks/home.mock";

export function PromoBanners() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {PROMOS.map((promo) => (
        <PromoCard key={promo.id} promo={promo} />
      ))}
    </div>
  );
}

function PromoCard({ promo }: { promo: Promo }) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-3xl",
        promo.bgClass
      )}
    >
      <div className="relative w-full sm:w-[45%] aspect-square shrink-0 overflow-hidden rounded-2xl">
        <Image
          src={promo.imageSrc}
          alt={promo.title}
          fill
          className="object-cover"
          sizes="(min-width: 640px) 25vw, 50vw"
        />
      </div>

      <div className="flex flex-col justify-center py-2 sm:py-6 pr-2 sm:pr-4 w-full">
        <p className="text-xs font-bold uppercase tracking-wider text-[#ea6734] mb-1 sm:mb-2">
          {promo.eyebrow}
        </p>
        <h3 className="text-2xl sm:text-4xl font-extrabold uppercase text-white mb-1 sm:mb-2">
          {promo.title}
        </h3>
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <span className="text-lg sm:text-xl font-bold text-white">{promo.price}</span>
          <span className="text-base sm:text-lg text-white/50 line-through decoration-1">{promo.originalPrice}</span>
        </div>
        <ButtonLink
          href={promo.href}
          size="sm"
          className="w-fit gap-2 rounded-full border-none bg-white/10 text-white hover:bg-white/20 px-4 sm:px-5 transition-colors"
        >
          Shop this deal
          <ArrowRight className="size-4 text-[#ea6734]" aria-hidden />
        </ButtonLink>
      </div>
    </div>
  );
}
