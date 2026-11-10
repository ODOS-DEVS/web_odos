"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useCampaigns } from "@/hooks/use-catalog";
import { cn } from "@/libs/cn";

const SLIDE_MS = 5000;

/**
 * The campaigns marketing is currently running.
 *
 * This used to be a hardcoded list of seasonal slides with stock photos, pointing at
 * `/products?tag=christmas` and friends — tags the catalogue has no concept of, so every one of
 * them quietly showed the unfiltered product list. It reads `/catalog/campaigns` now and hides
 * itself when nothing is running, rather than advertising deals that do not exist.
 */
export function WeeklyDealBanner() {
  const { data } = useCampaigns();
  const campaigns = data ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (campaigns.length < 2) return;
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % campaigns.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [campaigns.length]);

  if (campaigns.length === 0) return null;

  // A campaign removed while the carousel is mid-rotation must not leave it pointing past the end.
  const activeIndex = Math.min(currentIndex, campaigns.length - 1);

  return (
    <div className="relative isolate w-full overflow-hidden">
      {/* Slides sit side by side in one strip; sliding it left is what gives the right-to-left motion. */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {campaigns.map((campaign, index) => (
          <div
            key={campaign.id}
            className="relative flex min-h-70 w-full shrink-0 items-center sm:min-h-80"
            aria-hidden={index !== activeIndex}
          >
            {campaign.bannerImageUrl ? (
              <Image
                src={campaign.bannerImageUrl}
                alt=""
                fill
                className="object-cover object-center"
                sizes="100vw"
                priority={index === 0}
              />
            ) : (
              <div className="absolute inset-0 bg-accent-soft" />
            )}
            <div className="absolute inset-0 bg-black/40" />

            <Container className="relative z-10 w-full py-8">
              <div className="w-full max-w-145 rounded-2xl bg-[#e3e3e3] p-6 shadow-sm sm:p-8">
                <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-black sm:text-[36px]">
                  {campaign.title}
                </h2>
                {(campaign.subtitle || campaign.description) && (
                  <p className="mb-5 min-h-12 text-sm leading-relaxed text-[#333333] sm:text-base">
                    {campaign.subtitle ?? campaign.description}
                  </p>
                )}
                <ButtonLink
                  href={`/campaigns/${campaign.slug}`}
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

      {campaigns.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
          {campaigns.map((campaign, index) => (
            <button
              key={campaign.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "size-2.5 rounded-full shadow-sm transition-all duration-300",
                index === activeIndex ? "w-4 bg-black" : "bg-white hover:bg-white/80",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
