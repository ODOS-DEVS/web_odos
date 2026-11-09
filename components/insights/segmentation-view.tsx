"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Download, Lock, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { RequireLogin } from "@/components/auth/require-login";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { SelectField } from "@/components/ui/select";
import { useChurnRisk, useCustomerProfile, useExportSegment, useSegmentMembers, useSegmentOverview, useSegmentStats } from "@/hooks/use-segmentation";
import { cn } from "@/libs/cn";
import { ApiError } from "@/services/http";
import { segmentsFromOverview, toCsv, type Json } from "@/services/segmentation.service";

const titleCase = (s: string) => s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const isPrimitive = (v: Json) => v == null || ["string", "number", "boolean"].includes(typeof v);

function formatValue(key: string, v: Json): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") {
    if (/score|probab|risk|rate|ratio|percent/i.test(key) && v <= 1 && v >= 0) return `${Math.round(v * 100)}%`;
    if (/spent|value|revenue|amount|aov|monetary|ltv/i.test(key)) return `GH₵ ${v.toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;
    return v.toLocaleString("en-GH", { maximumFractionDigits: 2 });
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

const userIdOf = (row: Json): string | null => (row && typeof row === "object" ? (row.user_id ?? row.customer_id ?? row.id ?? null) : null);

/** Every primitive field of an object as a stat tile; nested objects get their own titled grid. */
function KeyValues({ data, className }: { data: Json; className?: string }) {
  if (!data || typeof data !== "object") return <p className="text-sm text-muted">{formatValue("", data)}</p>;
  const entries = Object.entries(data);
  const flat = entries.filter(([, v]) => isPrimitive(v));
  const nested = entries.filter(([, v]) => v && typeof v === "object" && !Array.isArray(v));
  const lists = entries.filter((e): e is [string, Json[]] => Array.isArray(e[1]) && e[1].length > 0);
  return (
    <div className={cn("space-y-4", className)}>
      {flat.length > 0 && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {flat.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-surface p-3">
              <dt className="truncate text-xs text-muted">{titleCase(k)}</dt>
              <dd className="mt-1 truncate font-semibold tabular-nums">{formatValue(k, v)}</dd>
            </div>
          ))}
        </dl>
      )}
      {nested.map(([k, v]) => (
        <div key={k}>
          <p className="mb-2 text-sm font-semibold">{titleCase(k)}</p>
          <KeyValues data={v} />
        </div>
      ))}
      {lists.map(([k, v]) => (
        <div key={k}>
          <p className="mb-2 text-sm font-semibold">{titleCase(k)}</p>
          {isPrimitive(v[0]) ? <p className="text-sm text-muted">{v.join(", ")}</p> : <DataTable rows={v} />}
        </div>
      ))}
    </div>
  );
}

function DataTable({ rows, onRowClick, maxColumns = 6 }: { rows: Json[]; onRowClick?: (row: Json) => void; maxColumns?: number }) {
  const objects = rows.filter((r) => r && typeof r === "object");
  const columns = [...new Set(objects.flatMap((r) => Object.keys(r).filter((k) => isPrimitive(r[k]))))].slice(0, maxColumns);
  if (objects.length === 0) return <p className="text-sm text-muted">No rows.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-surface-muted text-xs text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2.5 font-medium whitespace-nowrap">
                {titleCase(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {objects.map((row, i) => (
            <tr key={userIdOf(row) ?? i} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn(onRowClick && "cursor-pointer hover:bg-surface-muted")}>
              {columns.map((c) => (
                <td key={c} className="max-w-56 truncate px-3 py-2.5 tabular-nums">
                  {formatValue(c, row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

function SegmentPanel({ segment, onOpenUser }: { segment: string; onOpenUser: (id: string) => void }) {
  const stats = useSegmentStats(segment);
  const members = useSegmentMembers(segment);
  const exporter = useExportSegment();

  const onExport = () =>
    exporter.mutate(segment, {
      onSuccess: (rows) => {
        if (rows.length === 0) return void toast.info("This segment has no one to export");
        download(`odos-segment-${segment}.csv`, toCsv(rows));
        toast.success(`Exported ${rows.length} customers`);
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <Section
      title={`${titleCase(segment)} customers`}
      action={
        <Button size="sm" variant="outline" onClick={onExport} disabled={exporter.isPending}>
          <Download className="mr-1.5 size-4" aria-hidden /> {exporter.isPending ? "Exporting…" : "Export CSV"}
        </Button>
      }
    >
      {stats.isPending ? (
        <div className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
      ) : stats.isError ? (
        <QueryError error={stats.error} onRetry={() => stats.refetch()} title="We couldn’t load this segment’s stats" />
      ) : (
        <KeyValues data={stats.data} />
      )}
      {members.isPending ? (
        <div className="h-48 animate-pulse rounded-2xl bg-surface-muted" />
      ) : members.isError ? (
        <QueryError error={members.error} onRetry={() => members.refetch()} title="We couldn’t load the members" />
      ) : (
        <DataTable rows={members.data} onRowClick={(row) => userIdOf(row) && onOpenUser(String(userIdOf(row)))} />
      )}
    </Section>
  );
}

function CustomerProfile({ userId }: { userId: string }) {
  const profile = useCustomerProfile(userId);
  if (profile.isPending) return <div className="m-5 h-48 animate-pulse rounded-2xl bg-surface-muted" />;
  if (profile.isError) return <div className="p-5"><QueryError error={profile.error} onRetry={() => profile.refetch()} title="We couldn’t load this customer" /></div>;
  return <KeyValues data={profile.data} className="overflow-y-auto p-5" />;
}

const THRESHOLDS = ["50%", "60%", "70%", "80%", "90%"] as const;

function Insights() {
  const overview = useSegmentOverview();
  const [segment, setSegment] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<(typeof THRESHOLDS)[number]>("70%");
  const churn = useChurnRisk(parseInt(threshold, 10) / 100);
  const [lookup, setLookup] = useState("");
  const [openUser, setOpenUser] = useState<string | null>(null);

  const forbidden = overview.error instanceof ApiError && (overview.error.status === 403 || overview.error.status === 401);
  if (forbidden) {
    return (
      <EmptyState
        icon={<Lock className="size-10 text-muted" aria-hidden />}
        title="You don’t have access to customer insights"
        description="Customer segmentation is available to ODOS staff accounts."
      />
    );
  }

  const segments = overview.data ? segmentsFromOverview(overview.data) : [];
  const onLookup = (e: FormEvent) => {
    e.preventDefault();
    if (lookup.trim()) setOpenUser(lookup.trim());
  };

  return (
    <div className="space-y-10">
      <Section title="Segments">
        {overview.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
            ))}
          </div>
        ) : overview.isError ? (
          <QueryError error={overview.error} onRetry={() => overview.refetch()} title="We couldn’t load the overview" />
        ) : (
          <>
            {segments.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {segments.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSegment(s.key)}
                    aria-pressed={segment === s.key}
                    className={cn(
                      "press rounded-2xl border bg-surface p-4 text-left hover:border-foreground",
                      segment === s.key ? "border-foreground" : "border-line",
                    )}
                  >
                    <p className="truncate text-xs text-muted">{s.label}</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums">{s.count ?? "—"}</p>
                    <p className="mt-1 text-[11px] text-muted">customers</p>
                  </button>
                ))}
              </div>
            )}
            {/* Anything else the overview returns (totals, averages…). */}
            <KeyValues data={Object.fromEntries(Object.entries(overview.data ?? {}).filter(([k]) => !/^(segments|segment_counts|by_segment|distribution)$/.test(k)))} />
          </>
        )}
      </Section>

      {segment && <SegmentPanel segment={segment} onOpenUser={setOpenUser} />}

      <Section
        title="Churn risk"
        action={
          <SelectField
            id="churn-threshold"
            label="Risk at least"
            value={threshold}
            onValueChange={(v) => setThreshold(v as (typeof THRESHOLDS)[number])}
            options={THRESHOLDS}
            className="w-40"
          />
        }
      >
        {churn.isPending ? (
          <div className="h-48 animate-pulse rounded-2xl bg-surface-muted" />
        ) : churn.isError ? (
          <QueryError error={churn.error} onRetry={() => churn.refetch()} title="We couldn’t load churn risk" />
        ) : churn.data.length === 0 ? (
          <EmptyState icon={<AlertTriangle className="size-10 text-muted" aria-hidden />} title="No one above this risk level" description="Try a lower threshold." />
        ) : (
          <DataTable rows={churn.data} onRowClick={(row) => userIdOf(row) && setOpenUser(String(userIdOf(row)))} />
        )}
      </Section>

      <Section title="Look up a customer">
        <form onSubmit={onLookup} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="Customer user ID"
              aria-label="Customer user ID"
              className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm focus:border-foreground focus:outline-none"
            />
          </div>
          <Button type="submit" variant="accent">
            <Users className="mr-1.5 size-4" aria-hidden /> View
          </Button>
        </form>
      </Section>

      <Drawer open={openUser !== null} onClose={() => setOpenUser(null)} title="Customer profile" labelId="segmentation-customer-heading">
        {openUser && <CustomerProfile key={openUser} userId={openUser} />}
      </Drawer>
    </div>
  );
}

/** /insights — customer segmentation (overview, segments, churn risk, profiles, export). */
export function SegmentationView() {
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-3xl font-semibold sm:text-4xl">Customer insights</h1>
      <p className="mt-2 mb-8 text-muted">Who your customers are, who’s drifting away, and lists you can export for campaigns.</p>
      <RequireLogin next="/insights" message="Log in to view customer insights.">
        <Insights />
      </RequireLogin>
    </Container>
  );
}
