import type { Campaign } from "@/types/catalog";

/**
 * How a campaign's schedule should read on a card.
 *
 * `secondsRemaining` is counted by the server, so it is trusted over comparing `endsAt` to the
 * browser clock — a device with a wrong date would otherwise show a live campaign as finished.
 * Campaigns the backend has already excluded never reach here; this only phrases what is sent.
 */
export function campaignTiming(campaign: Campaign): { label: string; urgent: boolean } | null {
  const { secondsRemaining, startsAt, endsAt } = campaign;

  if (secondsRemaining > 0) {
    const hours = Math.floor(secondsRemaining / 3600);
    if (hours < 1) {
      const minutes = Math.max(1, Math.floor(secondsRemaining / 60));
      return { label: `Ends in ${minutes} min`, urgent: true };
    }
    if (hours < 24) return { label: `Ends in ${hours}h`, urgent: true };
    const days = Math.floor(hours / 24);
    return { label: days === 1 ? "Ends tomorrow" : `${days} days left`, urgent: days <= 2 };
  }

  // No countdown: either it has no end date, or it has not started.
  if (startsAt && Date.parse(startsAt) > Date.now()) {
    return { label: `Starts ${new Date(startsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`, urgent: false };
  }
  if (endsAt) {
    return {
      label: `Until ${new Date(endsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`,
      urgent: false,
    };
  }
  return null;
}
