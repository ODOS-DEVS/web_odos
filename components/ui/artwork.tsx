import type { CSSProperties } from "react";
import { cn } from "@/libs/cn";

/**
 * Placeholder artwork: a soft OKLCH gradient tinted by `hue` with an emoji.
 * Swap for `next/image` (and add the API's image host to `remotePatterns`)
 * once real product photos are available.
 */
export function Artwork({
  emoji,
  hue,
  className,
  emojiClassName,
  shift = 0,
}: {
  emoji: string;
  hue: number;
  className?: string;
  emojiClassName?: string;
  /** Nudges the hue so gallery thumbnails look like different shots. */
  shift?: number;
}) {
  const h = hue + shift;
  const style: CSSProperties = {
    backgroundImage: `radial-gradient(120% 90% at 30% 15%, oklch(0.97 0.035 ${h}) 0%, oklch(0.9 0.075 ${h + 12}) 55%, oklch(0.84 0.1 ${h + 24}) 100%)`,
  };
  return (
    <div
      className={cn("relative grid place-items-center overflow-hidden", className)}
      style={style}
      aria-hidden
    >
      <span
        className={cn("select-none drop-shadow-sm", emojiClassName ?? "text-6xl")}
        style={{ transform: `rotate(${shift ? -6 : 0}deg)` }}
      >
        {emoji}
      </span>
    </div>
  );
}
