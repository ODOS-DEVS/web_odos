/* eslint-disable @typescript-eslint/no-explicit-any -- segmentation responses are untyped in the API spec */
import { CUSTOMER_SEGMENTATION_ENDPOINTS } from "@/libs/api-endpoint";
import { apiFetch } from "./http";

/** Loose JSON from the segmentation API; the UI renders whatever keys come back. */
export type Json = any;

export type SegmentSummary = { key: string; label: string; count: number | null; raw: Json };

const titleCase = (s: string) => s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const firstArray = (res: Json): Json[] => {
  if (Array.isArray(res)) return res;
  for (const key of ["users", "members", "customers", "items", "results", "data", "segments", "at_risk"]) {
    if (Array.isArray(res?.[key])) return res[key];
  }
  return [];
};

/** Pulls the segment list out of the overview, whichever of the usual shapes it takes. */
export function segmentsFromOverview(overview: Json): SegmentSummary[] {
  const src = overview?.segments ?? overview?.segment_counts ?? overview?.by_segment ?? overview?.distribution ?? overview;
  if (Array.isArray(src)) {
    return src
      .map((s: Json) => {
        const key = String(s?.segment ?? s?.key ?? s?.name ?? s?.id ?? "");
        return { key, label: titleCase(s?.label ?? key), count: Number.isFinite(+(s?.count ?? s?.users ?? s?.total)) ? +(s?.count ?? s?.users ?? s?.total) : null, raw: s };
      })
      .filter((s) => s.key);
  }
  if (src && typeof src === "object") {
    return Object.entries(src)
      .filter(([, v]) => typeof v === "number" || (v && typeof v === "object" && !Array.isArray(v)))
      .map(([key, v]: [string, Json]) => ({
        key,
        label: titleCase(key),
        count: typeof v === "number" ? v : Number.isFinite(+(v?.count ?? v?.users ?? v?.total)) ? +(v?.count ?? v?.users ?? v?.total) : null,
        raw: v,
      }));
  }
  return [];
}

/** /customer-segmentation/* — RFM-style customer segments, churn risk and per-customer profiles. */
export const segmentationService = {
  overview: () => apiFetch<Json>(CUSTOMER_SEGMENTATION_ENDPOINTS.overview, { revalidate: false }),

  async churnRisk(threshold = 0.7, limit = 100): Promise<Json[]> {
    return firstArray(await apiFetch<Json>(CUSTOMER_SEGMENTATION_ENDPOINTS.churnRisk, { query: { threshold, limit }, revalidate: false }));
  },

  user: (userId: string) => apiFetch<Json>(CUSTOMER_SEGMENTATION_ENDPOINTS.user(userId.trim()), { revalidate: false }),

  async members(segment: string, limit = 100): Promise<Json[]> {
    return firstArray(await apiFetch<Json>(CUSTOMER_SEGMENTATION_ENDPOINTS.segment(segment), { query: { limit }, revalidate: false }));
  },

  stats: (segment: string) => apiFetch<Json>(CUSTOMER_SEGMENTATION_ENDPOINTS.segmentStats(segment), { revalidate: false }),

  /** The export payload (for email campaigns); the UI turns its rows into a CSV download. */
  async export(segment: string): Promise<Json[]> {
    const res = await apiFetch<Json>(CUSTOMER_SEGMENTATION_ENDPOINTS.segmentExport(segment), { revalidate: false });
    const rows = firstArray(res);
    return rows.length ? rows : res?.emails && Array.isArray(res.emails) ? res.emails.map((email: string) => ({ email })) : [];
  },
};

/** Rows of objects → CSV text (union of keys as the header). */
export function toCsv(rows: Json[]): string {
  const objects = rows.map((r) => (r && typeof r === "object" ? r : { value: r }));
  const headers = [...new Set(objects.flatMap((r) => Object.keys(r)))];
  const cell = (v: Json) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...objects.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\n");
}
