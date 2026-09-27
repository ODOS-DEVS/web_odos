import Image from "next/image";
import { cn } from "@/libs/cn";
import { hueFromSeed, monogram } from "@/libs/seed";

/**
 * A real photo (Cloudinary, via next/image) that fills its box, or — when there is no image — a soft
 * tinted tile with the name's initials. The wrapper is `relative overflow-hidden`; size it with
 * `className` (e.g. `aspect-square`, `size-12 rounded-full`).
 */
export function Media({
  src,
  alt = "",
  name,
  sizes,
  priority,
  className,
  imgClassName,
}: {
  src?: string | null;
  /** Empty by default: images beside their own text label are decorative. */
  alt?: string;
  /** Used for the fallback initials and colour. */
  name: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const hue = hueFromSeed(name);
  // `cloudinaryLoader` only varies the URL by width for Cloudinary sources; for anything else it's an
  // identity passthrough, which breaks Next's width-aware `srcset` generation (it warns about this).
  // Optimizing those non-Cloudinary URLs would only serve the same full-size image mislabeled as every
  // width in the `srcset`, so skip optimization for them instead.
  const unoptimized = Boolean(src) && !src!.includes("res.cloudinary.com");

  return (
    <div className={cn("relative overflow-hidden bg-surface-muted", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"}
          priority={priority}
          unoptimized={unoptimized}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div
          aria-hidden
          // Flat solid colour, not a gradient — matches how every reference app (Shop, 15Five, Clerk's
          // own avatar settings) renders an initials fallback.
          className="grid size-full place-items-center text-2xl font-semibold tracking-tight text-white"
          style={{ backgroundColor: `oklch(0.58 0.1 ${hue})` }}
        >
          {monogram(name)}
        </div>
      )}
    </div>
  );
}
