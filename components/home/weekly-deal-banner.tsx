"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";
import type { Campaign } from "@/types/catalog";

/** Auto-advancing carousel of live merchandising campaigns. Renders nothing when none are running. */
export function WeeklyDealBanner({ campaigns }: { campaigns: Campaign[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const count = campaigns.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;
  // The list can shrink after a refetch; never point past the end.
  const active = currentIndex % count;

  return (
    <div className="relative isolate w-full overflow-hidden">
      {/* Slides sit side by side in one strip; sliding it left is what gives the right-to-left motion. */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {campaigns.map((campaign, index) => (
          <div
            key={campaign.id}
            className="relative flex min-h-70 w-full shrink-0 items-center bg-[#2b2b2b] sm:min-h-80"
            aria-hidden={index !== active}
            style={campaign.themeColor ? { backgroundColor: campaign.themeColor } : undefined}
          >
            {campaign.imageUrl && (
              <div className="absolute inset-0">
                <Media
                  src={campaign.imageUrl}
                  name={campaign.title}
                  className="size-full"
                  imgClassName="object-center"
                  sizes="100vw"
                  priority={index === 0}
                />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40" />

            <Container className="relative z-10 w-full py-8">
              <div className="w-full max-w-145 rounded-2xl bg-[#e3e3e3] p-6 shadow-sm sm:p-8">
                <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-black sm:text-[36px]">{campaign.title}</h2>
                {campaign.description && (
                  <p className="mb-5 min-h-12 text-sm leading-relaxed text-[#333333] sm:text-base">{campaign.description}</p>
                )}
                <ButtonLink
                  href={`/products?campaign=${encodeURIComponent(campaign.slug)}`}
                  size="sm"
                  className="w-fit gap-2 rounded-full border-none bg-black/10 px-5 font-semibold text-black transition-colors hover:bg-black/20"
                >
                  View this deal
                  <ArrowRight className="size-4 text-[#ea6734]" aria-hidden />
                </ButtonLink>
              </div>
            </Container>
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
          {campaigns.map((campaign, index) => (
            <button
              key={campaign.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "size-2.5 rounded-full shadow-sm transition-all duration-300",
                index === active ? "w-4 bg-black" : "bg-white hover:bg-white/80",
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active}
            />
          ))}
        </div>
      )}
    </div>
  );
}
