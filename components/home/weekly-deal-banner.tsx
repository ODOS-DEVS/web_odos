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

  const currentDeal = DEALS[currentIndex];

  return (
    <div className="relative isolate w-full min-h-[280px] sm:min-h-[320px] overflow-hidden flex items-center">
      {/* Images with transition */}
      {DEALS.map((deal, index) => (
        <div
          key={deal.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            index === currentIndex ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={deal.image}
            alt={deal.title}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Dark Color Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Content */}
      <Container className="relative z-10 w-full py-8 mb-6">
        <div className="w-full max-w-[580px] bg-[#e3e3e3] rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-500 transform">
          <h2 className="text-3xl sm:text-[36px] font-extrabold text-black mb-3 tracking-tight transition-all duration-300">
            {currentDeal.title}
          </h2>
          <p className="text-sm sm:text-base text-[#333333] mb-5 leading-relaxed min-h-[48px]">
            {currentDeal.description}
          </p>
          <ButtonLink 
            href={currentDeal.href} 
            size="sm" 
            className="w-fit gap-2 rounded-full border-none bg-black/10 text-black font-semibold hover:bg-black/20 px-5 transition-colors"
          >
            View this deal
            <ArrowRight className="size-4 text-[#ea6734]" aria-hidden />
          </ButtonLink>
        </div>
      </Container>

      {/* Carousel Indicators */}
      <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2" aria-hidden>
        {DEALS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "size-2.5 rounded-full shadow-sm transition-all duration-300",
              index === currentIndex ? "bg-black w-4" : "bg-white hover:bg-white/80"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
