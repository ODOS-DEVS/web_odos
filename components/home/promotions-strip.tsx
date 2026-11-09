"use client";

import { PromoTracker } from "@/components/tracking/track";
import { usePathname } from "next/navigation";
import { Check, Copy, Sparkles, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSession } from "@/hooks/use-auth";
import { useClaimVoucher, usePromotions } from "@/hooks/use-product-extras";
import { formatDate, formatMoneyCompact } from "@/libs/format";
import type { StoreVoucher } from "@/types/voucher";

/**
 * ODOS-wide promotions (GET /vouchers/promotions) on the home page. "Auto" promotions apply themselves
 * at checkout; the others can be saved to the shopper's wallet. Hidden when there are none.
 */
export function PromotionsStrip() {
  const promotions = usePromotions();
  const items = promotions.data ?? [];

  if (promotions.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading promotions">
        <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-surface-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="promotions-heading">
      <SectionHeading title="ODOS promotions" description="Savings on your whole basket, from any store." />
      <h2 id="promotions-heading" className="sr-only">
        ODOS promotions
      </h2>
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {items.map((promo) => (
          <li key={promo.id} className="w-[84%] shrink-0 snap-start sm:w-auto sm:shrink">
            <PromoTracker entityType="voucher" entityId={promo.id} source="home">
              <PromotionCard promo={promo} />
            </PromoTracker>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PromotionCard({ promo }: { promo: StoreVoucher }) {
  const session = useSession();
  const pathname = usePathname();
  const claim = useClaimVoucher(null);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      toast.success(`Code ${promo.code} copied`);
    } catch {
      toast.info(`Your code is ${promo.code}`);
    }
  };

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-accent/40 bg-accent-soft/40 p-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
            <TicketPercent className="size-4" aria-hidden />
            {promo.issuer ?? "ODOS"}
          </span>
          {promo.expiresAt && <span className="text-xs text-muted">Until {formatDate(promo.expiresAt)}</span>}
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{promo.rewardText}</p>
        <p className="mt-1 font-medium">{promo.title}</p>
        {promo.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{promo.description}</p>}
        <p className="mt-2 text-xs text-muted">
          {promo.minSubtotal > 0 ? `On orders over ${formatMoneyCompact(promo.minSubtotal)}` : "No minimum spend"}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyCode}
          className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm font-semibold tracking-wider hover:border-foreground"
          aria-label={`Copy code ${promo.code}`}
        >
          {promo.code}
          <Copy className="size-3.5 text-muted" aria-hidden />
        </button>

        {promo.autoApply ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <Sparkles className="size-3.5" aria-hidden /> Applied automatically at checkout
          </span>
        ) : promo.claimed ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
            <Check className="size-4" aria-hidden /> Saved
          </span>
        ) : session ? (
          <Button
            size="sm"
            variant="outline"
            disabled={claim.isPending}
            onClick={() =>
              claim.mutate(promo.id, {
                onSuccess: () => toast.success(`${promo.title} saved to your vouchers`),
                onError: (error) => toast.error(error.message),
              })
            }
          >
            {claim.isPending ? "Saving…" : "Save"}
          </Button>
        ) : (
          <ButtonLink size="sm" variant="outline" href={`/login?next=${encodeURIComponent(pathname)}`}>
            Log in to save
          </ButtonLink>
        )}
      </div>
    </article>
  );
}
