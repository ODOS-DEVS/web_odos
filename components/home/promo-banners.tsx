import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/libs/cn";
import { PROMOS, type Promo } from "@/mocks/home.mock";

export function PromoBanners() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
      {PROMOS.map((promo) => (
        <PromoCard key={promo.id} promo={promo} />
      ))}
    </div>
  );
}

function PromoCard({ promo }: { promo: Promo }) {
  return (
    <Link
      href={promo.href}
      className={cn(
        "group grid min-h-36 grid-cols-[minmax(0,40%)_1fr] items-center gap-3 rounded-2xl p-3 touch-manipulation select-none transition-transform duration-300 ease-out active:scale-[0.99] sm:min-h-40 sm:grid-cols-[minmax(0,36%)_1fr] sm:gap-5 sm:rounded-3xl sm:p-4 md:grid-cols-[minmax(0,42%)_1fr] lg:min-h-52 lg:gap-6 hover:-translate-y-1",
        promo.bgClass
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl">
        <Image
          src={promo.imageSrc}
          alt={promo.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 22vw, 38vw"
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center py-1 pr-1 sm:py-3 sm:pr-3 lg:py-6 lg:pr-4">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#ea6734] min-[380px]:text-[10px] sm:mb-2 sm:text-xs">
          {promo.eyebrow}
        </p>
        <h3 className="mb-1 text-base font-extrabold uppercase leading-tight text-white min-[380px]:text-lg sm:mb-2 sm:text-2xl lg:text-4xl">
          {promo.title}
        </h3>
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:mb-4 lg:mb-6">
          <span className="text-sm font-bold text-white sm:text-lg lg:text-xl">{promo.price}</span>
          <span className="text-[11px] text-white/50 line-through decoration-1 sm:text-sm lg:text-lg">{promo.originalPrice}</span>
        </div>
        <span
          className={buttonStyles({
            size: "sm",
            className: "h-8 w-fit gap-1.5 rounded-full border-none bg-white/10 px-3 text-[11px] text-white transition-colors sm:h-9 sm:px-4 sm:text-xs lg:px-5 group-hover:bg-white/20",
          })}
        >
          Shop this deal
          <ArrowRight className="size-3.5 text-[#ea6734] sm:size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
