"use client";

import { useId, useMemo, useState } from "react";
import { formatMoney } from "@/libs/format";
import type { VendorDailyPoint } from "@/types/vendor";

type Metric = "sales" | "orders";

const VIEW_W = 720;
const VIEW_H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 52 };

/** Clean axis ceiling: 0 / 500 / 1,000 rather than 0 / 487 / 974. */
function niceCeiling(max: number) {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= max) return candidate;
  }
  return 10 * magnitude;
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * One metric over time, drawn as a 2px line with a 10% area wash.
 *
 * Deliberately one series per chart: revenue and order count have incomparable scales, and
 * plotting them on two y-axes would invent a correlation the data does not contain. The caller
 * switches metric instead.
 */
export function TrendChart({ points, metric }: { points: VendorDailyPoint[]; metric: Metric }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const { path, area, coords, ceiling, ticks } = useMemo(() => {
    const values = points.map((p) => (metric === "sales" ? p.sales : p.orders));
    const ceil = niceCeiling(Math.max(...values, 0));
    const plotW = VIEW_W - PAD.left - PAD.right;
    const plotH = VIEW_H - PAD.top - PAD.bottom;
    const stepX = points.length > 1 ? plotW / (points.length - 1) : 0;

    const pts = values.map((value, i) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + plotH - (value / ceil) * plotH,
      value,
      date: points[i].date,
    }));

    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const base = PAD.top + plotH;
    const fill = pts.length
      ? `${line} L${pts[pts.length - 1].x.toFixed(2)},${base} L${pts[0].x.toFixed(2)},${base} Z`
      : "";

    return {
      path: line,
      area: fill,
      coords: pts,
      ceiling: ceil,
      ticks: [0, 0.5, 1].map((t) => ({ value: ceil * t, y: base - t * plotH })),
    };
  }, [points, metric]);

  // A series that is entirely zero is not a trend — a flat line pinned to the axis reads as a
  // chart that failed to load. Say there were no sales instead. (The live store is in exactly
  // this state: 30 daily points, all zero.)
  const hasAnyValue = points.some((p) => (metric === "sales" ? p.sales : p.orders) > 0);
  if (!points.length || !hasAnyValue) {
    return (
      <p className="grid h-48 place-items-center text-sm text-muted">
        No {metric === "sales" ? "sales" : "orders"} recorded in this period yet.
      </p>
    );
  }

  const format = (value: number) =>
    metric === "sales" ? formatMoney(value) : `${value} order${value === 1 ? "" : "s"}`;

  const active = hover === null ? null : coords[hover];
  const last = coords[coords.length - 1];
  const peakIndex = coords.reduce((best, p, i) => (p.value > coords[best].value ? i : best), 0);
  const peak = coords[peakIndex];

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-56 w-full touch-none"
        role="img"
        aria-label={`${metric === "sales" ? "Sales" : "Orders"} per day. Peak ${format(peak.value)} on ${shortDate(peak.date)}.`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Hairline, solid, recessive — never dashed. */}
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line x1={PAD.left} y1={tick.y} x2={VIEW_W - PAD.right} y2={tick.y} stroke="var(--chart-grid)" strokeWidth="1" />
            <text x={PAD.left - 8} y={tick.y + 4} textAnchor="end" className="fill-muted text-[11px] tabular-nums">
              {metric === "sales" ? Math.round(tick.value).toLocaleString() : Math.round(tick.value)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* End marker, ringed in the surface colour so it stays legible over the line. */}
        <circle cx={last.x} cy={last.y} r="4.5" fill="var(--chart-1)" stroke="var(--surface)" strokeWidth="2" />

        {active && (
          <g>
            <line x1={active.x} y1={PAD.top} x2={active.x} y2={VIEW_H - PAD.bottom} stroke="var(--chart-grid)" strokeWidth="1" />
            <circle cx={active.x} cy={active.y} r="5" fill="var(--chart-1)" stroke="var(--surface)" strokeWidth="2" />
          </g>
        )}

        {/* First and last date only: a tick per day collides on a 90-day window. */}
        <text x={PAD.left} y={VIEW_H - 8} className="fill-muted text-[11px]">
          {shortDate(coords[0].date)}
        </text>
        <text x={VIEW_W - PAD.right} y={VIEW_H - 8} textAnchor="end" className="fill-muted text-[11px]">
          {shortDate(last.date)}
        </text>

        {/* Invisible hit bands — wider than the marks, so hovering is easy. */}
        {coords.map((p, i) => (
          <rect
            key={p.date}
            x={i === 0 ? PAD.left : (coords[i - 1].x + p.x) / 2}
            y={PAD.top}
            width={Math.max(
              2,
              (i === coords.length - 1 ? VIEW_W - PAD.right : (coords[i + 1].x + p.x) / 2) -
                (i === 0 ? PAD.left : (coords[i - 1].x + p.x) / 2),
            )}
            height={VIEW_H - PAD.top - PAD.bottom}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      <figcaption className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
        <span aria-live="polite">
          {active ? (
            <>
              <span className="font-medium text-foreground">{format(active.value)}</span> on {shortDate(active.date)}
            </>
          ) : (
            <>
              Peak <span className="font-medium text-foreground">{format(peak.value)}</span> on {shortDate(peak.date)}
            </>
          )}
        </span>
        <span className="tabular-nums">Scale 0–{metric === "sales" ? Math.round(ceiling).toLocaleString() : Math.round(ceiling)}</span>
      </figcaption>
    </figure>
  );
}
