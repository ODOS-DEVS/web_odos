"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import Image from "next/image";
import { cn } from "@/libs/cn";
import { DEALS } from "@/mocks/home.mock";

export function WeeklyDealBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DEALS.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative isolate w-full overflow-hidden">
      {/* Slides sit side by side in one strip; sliding it left is what gives the right-to-left motion. */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {DEALS.map((deal, index) => (
          <div
            key={deal.id}
            className="relative flex min-h-70 w-full shrink-0 items-center sm:min-h-80"
            aria-hidden={index !== currentIndex}
          >
            <Image
              src={deal.image}
              alt={deal.title}
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-black/40" />

            <Container className="relative z-10 w-full py-8">
              <div className="w-full max-w-145 rounded-2xl bg-[#e3e3e3] p-6 shadow-sm sm:p-8">
                <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-black sm:text-[36px]">{deal.title}</h2>
                <p className="mb-5 min-h-12 text-sm leading-relaxed text-[#333333] sm:text-base">{deal.description}</p>
                <ButtonLink
                  href={deal.href}
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

      {/* Carousel Indicators */}
      <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
        {DEALS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "size-2.5 rounded-full shadow-sm transition-all duration-300",
              index === currentIndex ? "w-4 bg-black" : "bg-white hover:bg-white/80",
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
