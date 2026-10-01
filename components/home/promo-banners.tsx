import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";

type Promo = {
  id: string;
  href: string;
  eyebrow: string;
  emphasis: string;
  title: string;
  imageSeed: string;
  tone: "dark" | "light";
};

const PROMOS: Promo[] = [
  {
    id: "smart-watch",
    href: "/products?tag=flash",
    eyebrow: "Sell On",
    emphasis: "35% Off",
    title: "Smart Watch",
    imageSeed: "odos-promo-smart-watch",
    tone: "dark",
  },
  {
    id: "kids-fashion",
    href: "/products?category=fashion",
    eyebrow: "New Collection",
    emphasis: "",
    title: "Kid's Fashion",
    imageSeed: "odos-promo-kids-fashion",
    tone: "light",
  },
];

/** Two wide promo tiles — fixed dark/light branding so they read the same in both themes. */
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
  const dark = promo.tone === "dark";

  return (
    <div
      className={cn(
        "relative isolate min-h-64 overflow-hidden rounded-3xl sm:min-h-72",
        dark ? "bg-[#111110]" : "bg-[#f3f1ea]",
      )}
    >
      <div className="absolute inset-y-0 right-0 w-[58%]">
        <Media
          src={`https://picsum.photos/seed/${promo.imageSeed}/900/900`}
          name={promo.title}
          className="size-full"
          sizes="(min-width: 640px) 30vw, 60vw"
        />
        <div
          className={cn(
            "absolute inset-0 bg-linear-to-r",
            dark ? "from-[#111110] via-[#111110]/10 to-transparent" : "from-[#f3f1ea] via-[#f3f1ea]/10 to-transparent",
          )}
        />
      </div>

      <div className="relative z-10 flex h-full max-w-[65%] flex-col justify-center gap-4 p-8 sm:p-10">
        <p className={cn("text-base font-medium sm:text-lg", dark ? "text-white/90" : "text-[#16140f]/80")}>
          {promo.eyebrow}
          {promo.emphasis && <span className="font-semibold text-accent"> {promo.emphasis}</span>}
        </p>
        <h3 className={cn("text-3xl leading-tight font-semibold sm:text-4xl", dark ? "text-white" : "text-[#16140f]")}>
          {promo.title}
        </h3>
        <ButtonLink
          href={promo.href}
          size="sm"
          variant="outline"
          className={cn(
            "mt-2 w-fit",
            dark
              ? "border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10"
              : "border-[#16140f]/30 bg-transparent text-[#16140f] hover:border-[#16140f] hover:bg-[#16140f]/5",
          )}
        >
          Shop now
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </div>
    </div>
  );
}
