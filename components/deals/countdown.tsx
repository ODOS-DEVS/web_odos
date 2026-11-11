"use client";

import { useSyncExternalStore } from "react";

function remaining(endsAt: string): number {
  return Math.max(0, Math.floor((Date.parse(endsAt) - Date.now()) / 1000));
}

/** One shared ticker: every countdown on the page re-renders on the same beat. */
function subscribeToTicks(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Ticks down to a server timestamp. Display only — whether a flash price
 * still applies is always the backend's call at checkout; this never gates
 * anything itself.
 */
export function Countdown({ endsAt, className }: { endsAt: string; className?: string }) {
  // Server snapshot is 0 so SSR and the first client paint agree; the real
  // remaining time appears on hydration and ticks once a second after.
  const seconds = useSyncExternalStore(
    subscribeToTicks,
    () => remaining(endsAt),
    () => 0,
  );

  if (seconds <= 0) return <span className={className}>Ended</span>;

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const secs = seconds % 60;

  return (
    <span className={className} aria-label={`Ends in ${days ? `${days} days ` : ""}${hours} hours ${minutes} minutes`}>
      {days > 0 && <>{days}d </>}
      <span className="tabular-nums">{pad(hours)}:{pad(minutes)}:{pad(secs)}</span>
    </span>
  );
}
