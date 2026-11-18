"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { CampaignCard } from "@/components/home/campaign-card";
import { Carousel } from "@/components/ui/carousel";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { useCampaigns } from "@/hooks/use-catalog";

/**
 * Shown when no campaign is scheduled.
 *
 * The promos row would otherwise vanish, leaving a hole in the homepage on a quiet week and
 * making the site look unfinished. This keeps the slot filled with something true — it points at
 * the deals that genuinely exist rather than inventing a campaign that does not.
 */
function DefaultPromoCard() {
  return (
    <Link
      href="/deals"
      className="press group grid h-full grid-cols-1 overflow-hidden rounded-3xl border border-line bg-surface transition-shadow hover:shadow-lg sm:grid-cols-2"
    >
      <div className="relative grid aspect-[4/3] place-items-center bg-accent-soft sm:aspect-auto sm:h-full">
        <Sparkles className="size-12 text-accent" aria-hidden />
        <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-surface/90 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm backdrop-blur-sm">
          Always on
        </span>
      </div>

      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-bold tracking-tight sm:text-xl">Deals across ODOS</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted">
          No campaign is running right now, but vendors are discounting every day. See what is reduced
          today.
        </p>
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-foreground px-4 py-2 pt-2 text-sm font-semibold text-background transition-opacity group-hover:opacity-85">
          Browse today&apos;s deals
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/**
 * Live campaigns as a manually-controlled row.
 *
 * Never autoplays: a row that moves on its own shifts a link out from under the reader. Featured
 * campaigns come first; the backend already excludes anything expired or unpublished, so nothing
 * here re-implements those rules.
 */
export function FeaturedCampaigns() {
  const { data, isPending, isError } = useCampaigns();

  if (isPending) {
    return (
      <Container>
        <div className="h-7 w-44 animate-pulse rounded-full bg-surface-muted" aria-busy="true" />
        <div className="mt-5 flex gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-56 w-full max-w-md shrink-0 animate-pulse rounded-3xl bg-surface-muted" />
          ))}
        </div>
      </Container>
    );
  }

  const campaigns = isError ? [] : (data ?? []);

  // Nothing scheduled (or the feed failed) still shows the slot, with the standing deals card.
  if (campaigns.length === 0) {
    return (
      <Container>
        <SectionHeading title="Promotions" description="What is discounted on ODOS right now." href="/deals" hrefLabel="All deals" />
        <div className="mt-5 max-w-2xl">
          <DefaultPromoCard />
        </div>
      </Container>
    );
  }

  const ordered = [...campaigns].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.displayPriority - a.displayPriority,
  );

  // One campaign does not need a carousel; two or more scroll.
  if (ordered.length === 1) {
    return (
      <Container>
        <SectionHeading
          title="Shopping events"
          description="Seasonal sales and collections running right now."
          href="/campaigns"
          hrefLabel="All campaigns"
        />
        <div className="mt-5 max-w-2xl">
          <CampaignCard campaign={ordered[0]} />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <SectionHeading
        title="Shopping events"
        description="Seasonal sales and collections running right now."
        href="/campaigns"
        hrefLabel="All campaigns"
      />
      <div className="mt-5">
        <Carousel label="Shopping events" itemClassName="w-[20rem] sm:w-[26rem] lg:w-[30rem]">
          {ordered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </Carousel>
      </div>
    </Container>
  );
}
