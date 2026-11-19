"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CampaignCard } from "@/components/home/campaign-card";
import { cn } from "@/libs/cn";
import type { Campaign } from "@/types/catalog";

/**
 * One large campaign at a time, browsed by hand.
 *
 * Built on scroll-snap rather than a transform slider: swipe, trackpad and keyboard all work
 * without writing gesture code, and with JS unavailable it degrades to a scrollable row rather
 * than a stuck first slide.
 *
 * There is no autoplay and no timer anywhere in this file. A campaign that slides away on its
 * own moves a link out from under the reader mid-click, and on a page whose whole purpose is to
 * be clicked that is the one thing it must not do.
 *
 * The arrows sit outside the card on large screens, where there is room, and tuck over its
 * corners below that. Both are mirrored by the dots, which are real buttons — so every control
 * is reachable without a pointer.
 */
export function CampaignShowcase({ campaigns, source = "home" }: { campaigns: Campaign[]; source?: string }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    // Round to the nearest slide: momentum scrolling settles a pixel or two off the snap point.
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    sync();
    track.addEventListener("scroll", sync, { passive: true });
    // A late-loading image or a resize changes slide width; without this the dots drift.
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [sync, campaigns.length]);

  const goTo = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(campaigns.length - 1, next));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  };

  if (campaigns.length === 0) return null;

  // A single campaign gets the card without any navigation — arrows that cannot move and a lone
  // dot are noise, and a one-item carousel is not a carousel.
  if (campaigns.length === 1) {
    return (
      <div className="mx-auto max-w-5xl">
        <CampaignCard campaign={campaigns[0]} source={source} priority />
      </div>
    );
  }

  const atStart = index <= 0;
  const atEnd = index >= campaigns.length - 1;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative">
        <ul
          ref={trackRef}
          aria-label="Shopping events"
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        >
          {campaigns.map((campaign, position) => (
            <li key={campaign.id} className="w-full shrink-0 snap-center px-0.5">
              <CampaignCard campaign={campaign} source={source} priority={position === 0} />
            </li>
          ))}
        </ul>

        <Arrow side="left" disabled={atStart} onClick={() => goTo(index - 1)} />
        <Arrow side="right" disabled={atEnd} onClick={() => goTo(index + 1)} />
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {campaigns.map((campaign, position) => (
          <button
            key={campaign.id}
            type="button"
            onClick={() => goTo(position)}
            aria-label={`Show ${campaign.title}`}
            aria-current={position === index}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              position === index ? "w-7 bg-foreground" : "w-2 bg-line hover:bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function Arrow({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous campaign" : "Next campaign"}
      className={cn(
        "press absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full",
        "border border-line bg-surface shadow-lg transition-opacity",
        // Over the card's corner on small screens; clear of it once there is room.
        side === "left" ? "left-1 lg:-left-6" : "right-1 lg:-right-6",
        disabled ? "pointer-events-none opacity-0" : "opacity-100 hover:bg-surface-muted",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
