"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { CampaignShowcase } from "@/components/home/campaign-showcase";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { useCampaigns } from "@/hooks/use-catalog";

/**
 * Shown when no campaign is scheduled.
 *
 * The slot would otherwise vanish, leaving a hole on a quiet week and making the site look
 * unfinished. It keeps the same card proportions as a real campaign, and points at something
 * true — the deals that genuinely exist — rather than inventing a campaign that does not.
 */
function DefaultPromoCard() {
  return (
    <Link
      href="/deals"
      className="group mx-auto block max-w-5xl overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-sm transition-shadow duration-300 hover:shadow-xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
        <div className="relative grid aspect-[4/3] place-items-center bg-accent-soft sm:aspect-[16/10] md:h-full md:min-h-[21rem] md:aspect-auto">
          <Sparkles className="size-16 text-accent" aria-hidden />
          <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-accent px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-white uppercase shadow-sm">
            Always on
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-5 p-6 sm:p-8 lg:p-10">
          <div>
            <h3 className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">Deals across ODOS</h3>
            <p className="mt-1.5 text-sm text-muted">Reduced by vendors, every day</p>
          </div>
          <p className="text-sm leading-6 text-muted">
            No seasonal event is running right now, but vendors are discounting all the time. See
            what is reduced today across every market on ODOS.
          </p>
          <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none">
            Browse today&apos;s deals
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * The campaign slot: one large card at a time, browsed by hand.
 *
 * The backend already excludes anything unpublished, expired or hidden, so nothing here
 * re-implements those rules — featured campaigns simply come first.
 */
export function FeaturedCampaigns() {
  const { data, isPending, isError } = useCampaigns();

  if (isPending) {
    return (
      <Container>
        <div className="mb-6">
          <div className="h-8 w-72 animate-pulse rounded-lg bg-surface-muted" aria-busy="true" />
          <div className="mt-2 h-5 w-96 max-w-full animate-pulse rounded bg-surface-muted" />
        </div>
        <div className="mx-auto h-[21rem] max-w-5xl animate-pulse rounded-[1.75rem] bg-surface-muted" />
      </Container>
    );
  }

  const campaigns = isError ? [] : (data ?? []);

  if (campaigns.length === 0) {
    return (
      <Container>
        <SectionHeading
          title="Promotions"
          description="Seasonal events and everyday reductions from vendors across ODOS."
          href="/deals"
          hrefLabel="All deals"
        />
        <DefaultPromoCard />
      </Container>
    );
  }

  const ordered = [...campaigns].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.displayPriority - a.displayPriority,
  );

  return (
    <Container>
      {/* The shared heading, so the title, the "All campaigns" link and its arrow line up with
          every other section on the home page. The card below stays centred on its own. */}
      <SectionHeading
        title="Choose the event that suits you"
        description="Seasonal sales and curated collections running on ODOS right now."
        href="/campaigns"
        hrefLabel="All campaigns"
      />
      <CampaignShowcase campaigns={ordered} />
    </Container>
  );
}
