import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHeading({
  title,
  description,
  href,
  hrefLabel = "See all",
  eyebrow,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        {description && <p className="mt-1.5 max-w-xl text-muted">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-1 text-sm font-medium hover:text-accent sm:inline-flex"
        >
          {hrefLabel}
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}
