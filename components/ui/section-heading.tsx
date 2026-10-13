import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";

export function SectionHeading({
  title,
  description,
  href,
  hrefLabel = "See all",
  hrefAsButton,
  eyebrow,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  hrefAsButton?: boolean;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-5 sm:mb-6">
      {eyebrow && <div className="mb-2 sm:mb-2.5">{eyebrow}</div>}
      <div className="flex items-baseline justify-between gap-3 sm:gap-4">
        <h2 className="min-w-0 text-lg leading-tight font-semibold min-[360px]:text-[1.35rem] sm:text-3xl">{title}</h2>
        {href && (
          hrefAsButton ? (
            <ButtonLink
              href={href}
              variant="accent"
              size="sm"
              className="group inline-flex shrink-0"
            >
              {hrefLabel}
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </ButtonLink>
          ) : (
            <Link
              href={href}
              className="group inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold min-[360px]:text-xs sm:text-sm sm:font-medium hover:text-accent"
            >
              {hrefLabel}
              <ArrowRight
                className="size-3.5 transition-transform duration-200 sm:size-4 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          )
        )}
      </div>
      {description && (
        <p className="mt-1.5 max-w-xl text-[13px] leading-5 text-muted min-[360px]:text-sm sm:mt-2 sm:text-base sm:leading-6">
          {description}
        </p>
      )}
    </div>
  );
}
