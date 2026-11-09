"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/libs/cn";

const pad = (n: number) => String(n).padStart(2, "0");

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(total / 86_400), hours: Math.floor((total % 86_400) / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}

/**
 * Live "ends in" timer for a flash sale. Renders only after mount (the server's clock and the
 * shopper's differ, which would otherwise mismatch on hydration) and calls `onEnd` once at zero.
 */
export function Countdown({ endsAt, onEnd, className }: { endsAt: string; onEnd?: () => void; className?: string }) {
  const mounted = useMounted();
  const end = Date.parse(endsAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = end - now;
  useEffect(() => {
    if (mounted && remaining <= 0) onEnd?.();
    // Fire once when it crosses zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, remaining <= 0]);

  if (!mounted || Number.isNaN(end)) return null;
  if (remaining <= 0) {
    return <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium text-muted", className)}>Sale ended</span>;
  }

  const { days, hours, minutes, seconds } = split(remaining);
  const units = [...(days > 0 ? [{ v: days, l: "d" }] : []), { v: hours, l: "h" }, { v: minutes, l: "m" }, { v: seconds, l: "s" }];

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums", className)}
      role="timer"
      aria-label={`Ends in ${days ? `${days} days ` : ""}${hours} hours ${minutes} minutes`}
    >
      <Timer className="size-4 text-accent" aria-hidden />
      <span className="text-muted">Ends in</span>
      {units.map((unit) => (
        <span key={unit.l} className="rounded-md bg-accent-soft px-1.5 py-0.5 text-accent">
          {unit.l === "d" ? unit.v : pad(unit.v)}
          {unit.l}
        </span>
      ))}
    </span>
  );
}
