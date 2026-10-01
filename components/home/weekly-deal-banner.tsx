import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";

const buttonBase =
  "mt-4 w-fit border-white/50 bg-transparent text-xs tracking-wide text-white uppercase hover:border-white hover:bg-white/10";

/** A single wide deal banner with copy on both edges and a photo bleeding through the middle. */
export function WeeklyDealBanner() {
  return (
    <div className="relative isolate min-h-56 overflow-hidden bg-[#1a1612] sm:min-h-64">
      <Media
        src="https://picsum.photos/seed/odos-weekly-deal-headphones/1600/500"
        name="This week's deal"
        className="absolute inset-0 size-full"
        sizes="100vw"
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "linear-gradient(to right, rgba(10,9,7,0.82), rgba(10,9,7,0.25) 45%, rgba(10,9,7,0.25) 55%, rgba(10,9,7,0.82))" }}
      />

      <Container className="relative z-10 flex h-full flex-col items-stretch justify-between gap-6 py-8 sm:flex-row sm:items-center sm:py-10">
        <div className="max-w-xs">
          <h3 className="text-2xl font-semibold text-white sm:text-3xl">This Week&apos;s Deal</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem repudiandae in ipsam nesciunt.
          </p>
          <ButtonLink href="/products?tag=flash" size="sm" variant="outline" className={buttonBase}>
            View more
          </ButtonLink>
        </div>

        <div className="max-w-xs sm:text-right">
          <p className="text-sm font-semibold tracking-widest text-white uppercase">Headphones</p>
          <p className="text-2xl font-bold sm:text-3xl" style={{ color: "#ef4444" }}>
            Up To 20% Off
          </p>
          <p className="mt-1 text-sm text-white/70">Spring&apos;s collection has discounted now!</p>
          <ButtonLink href="/products?category=electronics" size="sm" variant="outline" className={cn(buttonBase, "sm:ml-auto")}>
            Shop now
          </ButtonLink>
        </div>
      </Container>

      <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5" aria-hidden>
        <span className="size-1.5 rounded-full bg-white" />
        <span className="size-1.5 rounded-full bg-white/40" />
      </div>
    </div>
  );
}
