import Image from "next/image";
import { cn } from "@/libs/cn";

export type Logo =
  /** Real brand mark, saved to `public/payment-logos/` from the network's own official site. */
  | { kind: "image"; src: string; alt: string }
  /** No official mark on hand for this one — a flat monogram chip instead. */
  | { kind: "monogram"; text: string; bg: string; fg: string };

export function LogoBadge({ logo, className }: { logo: Logo; className?: string }) {
  if (logo.kind === "image") {
    return (
      <span className={cn("relative shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/10", className)}>
        <Image src={logo.src} alt={logo.alt} fill sizes="48px" unoptimized className="object-contain p-1.5" />
      </span>
    );
  }
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full text-xs font-bold", className)}
      style={{ backgroundColor: logo.bg, color: logo.fg }}
    >
      {logo.text}
    </span>
  );
}
