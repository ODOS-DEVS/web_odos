"use client";

import Link from "next/link";
import { ArrowLeft, Clock, MapPin, MessageSquare, ShieldCheck, Star, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { formatMoney } from "@/libs/format";
import { useService } from "@/hooks/use-services";
import { useStores } from "@/hooks/use-catalog";
import { formatServicePrice } from "./services-view";

/** One service, its provider, and how to get in touch. */
export function ServiceDetailView({ id }: { id: string }) {
  const { data: service, isPending, isError } = useService(id);
  const stores = useStores();

  if (isPending) {
    return (
      <Container className="py-10">
        <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
      </Container>
    );
  }

  if (isError || !service) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={<Wrench className="size-10 text-muted" aria-hidden />}
          title="Service not available"
          description="This service isn't listed right now. It may have been unpublished, or the services marketplace isn't open yet."
          action={<ButtonLink href="/services">All services</ButtonLink>}
        />
      </Container>
    );
  }

  const store = stores.data?.find((s) => s.id === service.storeId);
  const gallery = service.images.length ? service.images : service.imageUrl ? [service.imageUrl] : [];

  return (
    <Container className="py-8 sm:py-10">
      <Link href="/services" className="press inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All services
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <Media
            src={gallery[0] ?? null}
            name={service.title}
            sizes="(min-width:1024px) 60vw, 100vw"
            className="aspect-[16/10] w-full rounded-2xl"
          />

          {gallery.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {gallery.slice(1).map((url) => (
                <Media key={url} src={url} name={service.title} sizes="120px" className="size-24 shrink-0 rounded-xl" />
              ))}
            </div>
          )}

          <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">{service.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {service.bookingType === "instant" ? (
              <Badge tone="success">Book instantly</Badge>
            ) : (
              <Badge tone="neutral">By request</Badge>
            )}
            {service.rating !== null && service.reviewCount > 0 && (
              <Badge tone="neutral">
                <Star className="size-3.5 fill-current text-warning" aria-hidden />
                {service.rating.toFixed(1)} · {service.reviewCount} review{service.reviewCount === 1 ? "" : "s"}
              </Badge>
            )}
            {service.bookingCount > 0 && <Badge tone="neutral">{service.bookingCount} booked</Badge>}
            {service.durationMinutes && (
              <Badge tone="neutral">
                <Clock className="size-3.5" aria-hidden />
                {service.durationMinutes} min
              </Badge>
            )}
          </div>

          {service.description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold">About this service</h2>
              <p className="mt-2 text-sm leading-7 whitespace-pre-line text-muted">{service.description}</p>
            </div>
          )}

          {service.packages.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold">Packages</h2>
              <ul className="mt-3 space-y-2">
                {service.packages.map((pkg) => (
                  <li key={pkg.id} className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{pkg.name}</p>
                      {pkg.description && <p className="mt-0.5 text-xs text-muted">{pkg.description}</p>}
                      {pkg.durationMinutes && <p className="mt-1 text-xs text-muted">{pkg.durationMinutes} min</p>}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(pkg.price)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {service.addons.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold">Optional extras</h2>
              <ul className="mt-3 space-y-2">
                {service.addons.map((addon) => (
                  <li key={addon.id} className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{addon.name}</p>
                      {addon.description && <p className="mt-0.5 text-xs text-muted">{addon.description}</p>}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">+{formatMoney(addon.price)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(service.requirementsNote || service.cancellationPolicy) && (
            <section className="mt-8 space-y-4">
              {service.requirementsNote && (
                <div>
                  <h2 className="text-sm font-semibold">What the provider needs from you</h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{service.requirementsNote}</p>
                </div>
              )}
              {service.cancellationPolicy && (
                <div>
                  <h2 className="text-sm font-semibold">Cancellation</h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{service.cancellationPolicy}</p>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-2xl font-bold">{formatServicePrice(service)}</p>
            <p className="mt-1 text-xs text-muted">
              {service.pricingModel === "quote"
                ? "The provider will send you a quote."
                : service.paymentTiming === "on_completion"
                  ? "Paid once the work is done."
                  : "Payment is arranged at booking."}
            </p>

            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              {service.leadTimeHours > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Earliest start</dt>
                  <dd>{service.leadTimeHours}h notice</dd>
                </div>
              )}
              {service.serviceAreas.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Covers</dt>
                  <dd className="text-right">{service.serviceAreas.join(", ")}</dd>
                </div>
              )}
              {service.locationModes.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Where</dt>
                  <dd className="text-right">{service.locationModes.map((m) => m.replace(/_/g, " ")).join(", ")}</dd>
                </div>
              )}
            </dl>

            {/* Enquiries go through the existing vendor chat rather than a second messaging system. */}
            {store ? (
              <ButtonLink href={`/stores/${store.slug}/chat`} size="lg" className="mt-4 w-full">
                <MessageSquare className="size-4" aria-hidden />
                {service.pricingModel === "quote" ? "Request a quote" : "Contact the provider"}
              </ButtonLink>
            ) : (
              <p className="mt-4 rounded-xl bg-surface-muted p-3 text-xs text-muted">
                Provider contact details are loading.
              </p>
            )}
          </div>

          {store && (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold">About the provider</h2>
              <Link href={`/stores/${store.slug}`} className="press mt-3 flex items-center gap-3">
                <Media src={store.logoUrl} name={store.name} sizes="48px" className="size-12 shrink-0 rounded-xl" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{store.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {[store.city, store.region].filter(Boolean).join(", ") || "ODOS provider"}
                  </span>
                </span>
              </Link>
              {store.rating > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                  <ShieldCheck className="size-3.5 text-success" aria-hidden />
                  {store.rating.toFixed(1)} average across their ODOS work
                </p>
              )}
              <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Always agree the scope and price in writing before work starts.
              </p>
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}
