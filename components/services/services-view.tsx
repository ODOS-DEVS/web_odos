"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, MapPin, Search, Sparkles, Star, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import { useServiceCategories, useServices } from "@/hooks/use-services";
import type { ServiceSummary } from "@/types/services";

/** "From GH₵x" for an hourly or quote-based price, an exact figure for a fixed one. */
export function formatServicePrice(service: Pick<ServiceSummary, "pricingModel" | "basePrice">) {
  if (service.pricingModel === "quote") return "Price on request";
  if (service.pricingModel === "hourly") return `${formatMoney(service.basePrice)}/hr`;
  return formatMoney(service.basePrice);
}

export function ServiceCard({ service }: { service: ServiceSummary }) {
  return (
    <Link
      href={`/services/${service.id}`}
      className="press group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface hover:border-foreground"
    >
      <Media src={service.imageUrl} name={service.title} sizes="(min-width:1024px) 25vw, 50vw" className="aspect-[4/3] w-full" />
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-accent">{service.title}</h3>
        {service.summary && <p className="mt-1 line-clamp-2 text-xs text-muted">{service.summary}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          {service.rating !== null && service.reviewCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-current text-warning" aria-hidden />
              {service.rating.toFixed(1)} ({service.reviewCount})
            </span>
          )}
          {service.durationMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {service.durationMinutes} min
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-sm font-semibold">{formatServicePrice(service)}</span>
          {service.bookingType === "instant" ? (
            <Badge tone="success">Book instantly</Badge>
          ) : (
            <Badge tone="neutral">By request</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Shopper-facing service discovery.
 *
 * The marketplace is live in the backend but not yet deployed, so a failed load is reported as
 * "not available yet" rather than as a broken page — that is the honest state, and it stops this
 * section looking like a bug when the API simply is not there.
 */
export function ServicesView() {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const categories = useServiceCategories();
  const services = useServices({ ...(category ? { category } : {}), ...(query.trim() ? { q: query.trim() } : {}) });

  const unavailable = categories.isError && services.isError;

  if (unavailable) {
    return (
      <Container className="py-10">
        <SectionHeading title="Services" description="Hire trusted local professionals through ODOS." />
        <div className="mt-8">
          <EmptyState
            icon={<Wrench className="size-10 text-muted" aria-hidden />}
            iconBadge
            title="Services are coming soon"
            description="The ODOS services marketplace isn't open yet. In the meantime you can shop products from local vendors."
            action={<ButtonLink href="/products" size="lg">Browse products</ButtonLink>}
          />
        </div>
      </Container>
    );
  }

  const rows = services.data ?? [];
  const topLevel = (categories.data ?? []).filter((c) => !c.parentId);

  return (
    <Container className="py-8 sm:py-10">
      <SectionHeading
        title="Services"
        description="Hire trusted local professionals — from repairs and cleaning to photography and tutoring."
      />

      <div className="relative mt-6 max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search services"
          placeholder="What do you need done?"
          className="h-12 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
        />
      </div>

      {topLevel.length > 0 && (
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "press shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium",
              !category ? "border-foreground bg-foreground text-background" : "border-line hover:border-foreground",
            )}
          >
            All services
          </button>
          {topLevel.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn(
                "press shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium",
                category === c.slug ? "border-foreground bg-foreground text-background" : "border-line hover:border-foreground",
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      {services.isPending ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Sparkles className="size-10 text-muted" aria-hidden />}
            title={query || category ? "No services match" : "No services listed yet"}
            description={
              query || category
                ? "Try a different search or category."
                : "Service providers are still joining ODOS. Check back shortly."
            }
          />
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">
            {rows.length} service{rows.length === 1 ? "" : "s"} available
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </>
      )}

      <p className="mt-10 flex items-center gap-2 text-sm text-muted">
        <MapPin className="size-4 shrink-0" aria-hidden />
        Offer a service yourself?{" "}
        <Link href="/account?tab=vendor&apply=1" className="press font-medium text-accent">
          Join ODOS as a provider
        </Link>
      </p>
    </Container>
  );
}
