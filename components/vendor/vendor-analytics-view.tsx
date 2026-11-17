"use client";

import { useState } from "react";
import { BarChart3, MousePointerClick, Percent, Tag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { TrendChart } from "@/components/vendor/charts/trend-chart";
import {
  PageHeader,
  Panel,
  PanelHeader,
  SegmentedControl,
  StatCard,
  StatGridSkeleton,
  TableScroll,
} from "@/components/vendor/vendor-ui";
import { formatMoney, formatMoneyCompact } from "@/libs/format";
import { useVendorAnalytics } from "@/hooks/use-vendor";
import { useVendorPerformance } from "@/hooks/use-vendor-ops";
import { useVendorPromoOverview } from "@/hooks/use-vendor-store";
import { useVendorProducts } from "@/hooks/use-vendor";
import type { VendorAnalyticsPeriod } from "@/types/vendor";

const PERIODS: { value: VendorAnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const DAYS: Record<VendorAnalyticsPeriod, number> = { "7d": 7, "30d": 30, "90d": 90 };

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

export function VendorAnalyticsView() {
  const [period, setPeriod] = useState<VendorAnalyticsPeriod>("30d");
  const [metric, setMetric] = useState<"sales" | "orders">("sales");

  const analytics = useVendorAnalytics(period);
  const performance = useVendorPerformance(DAYS[period]);
  const promos = useVendorPromoOverview(DAYS[period]);
  const products = useVendorProducts();

  if (analytics.isError) {
    return <QueryError title="We couldn't load your analytics" error={analytics.error} onRetry={() => analytics.refetch()} />;
  }

  const a = analytics.data;
  // The performance hook returns a Map keyed by product id, not a list.
  const rows = [...(performance.data?.values() ?? [])]
    .map((row) => ({ ...row, name: products.data?.find((p) => p.id === row.productId)?.name ?? row.productId }))
    .sort((x, y) => y.grossSales - x.grossSales);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="How your store performed over the window you pick."
        actions={<SegmentedControl label="Period" value={period} onChange={setPeriod} options={PERIODS} />}
      />

      {analytics.isPending || !a ? (
        <StatGridSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={`Revenue (${period})`} value={formatMoneyCompact(a.periodSales)} icon={<BarChart3 className="size-4" aria-hidden />} />
          <StatCard label={`Orders (${period})`} value={a.periodOrders} icon={<Tag className="size-4" aria-hidden />} />
          <StatCard
            label="Average order value"
            value={a.periodOrders > 0 ? formatMoneyCompact(a.periodSales / a.periodOrders) : formatMoneyCompact(0)}
            icon={<Percent className="size-4" aria-hidden />}
          />
          <StatCard
            label="Open returns"
            value={a.openReturns}
            tone={a.openReturns > 0 ? "warning" : "default"}
            icon={<MousePointerClick className="size-4" aria-hidden />}
          />
        </div>
      )}

      <Panel>
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold">{metric === "sales" ? "Revenue" : "Orders"} per day</h3>
          <SegmentedControl
            label="Metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "sales", label: "Revenue" },
              { value: "orders", label: "Orders" },
            ]}
          />
        </div>
        <div className="p-5">
          {analytics.isPending ? (
            <div className="h-56 animate-pulse rounded-xl bg-surface-muted" aria-busy="true" />
          ) : (
            <TrendChart points={a?.dailyPoints ?? []} metric={metric} />
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={`Product performance (${period})`} />
        <div className="p-5">
          {performance.isPending ? (
            <div className="h-40 animate-pulse rounded-xl bg-surface-muted" aria-busy="true" />
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No products sold in this window.</p>
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <caption className="sr-only">Units sold and revenue per product</caption>
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th scope="col" className="pb-3 font-medium">Product</th>
                    <th scope="col" className="pb-3 font-medium">Units</th>
                    <th scope="col" className="pb-3 font-medium">Orders</th>
                    <th scope="col" className="pb-3 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row) => (
                    <tr key={row.productId}>
                      <td className="max-w-[20rem] truncate py-3 pr-4 font-medium">{row.name}</td>
                      <td className="py-3 pr-4 tabular-nums">{row.unitsSold}</td>
                      <td className="py-3 pr-4 tabular-nums">{row.orderCount}</td>
                      <td className="py-3 font-semibold tabular-nums">{formatMoney(row.grossSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Promotion performance" />
        <div className="p-5">
          {promos.isPending ? (
            <div className="h-32 animate-pulse rounded-xl bg-surface-muted" aria-busy="true" />
          ) : promos.isError ? (
            <QueryError title="We couldn't load promotion analytics" error={promos.error} onRetry={() => promos.refetch()} />
          ) : !promos.data?.channels.length ? (
            <EmptyState
              icon={<Tag className="size-10 text-muted" aria-hidden />}
              title="No promotion data yet"
              description="Once your vouchers and campaigns start getting views, their funnel shows up here."
            />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Discount given" value={formatMoneyCompact(promos.data.totalDiscountGiven)} />
                <StatCard label="Redemptions" value={promos.data.totalRedemptions} />
              </div>
              <TableScroll>
                <table className="w-full text-sm">
                  <caption className="sr-only">Promotion funnel by channel</caption>
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th scope="col" className="pb-3 font-medium">Channel</th>
                      <th scope="col" className="pb-3 font-medium">Tracked</th>
                      <th scope="col" className="pb-3 font-medium">Views</th>
                      <th scope="col" className="pb-3 font-medium">Clicks</th>
                      <th scope="col" className="pb-3 font-medium">CTR</th>
                      <th scope="col" className="pb-3 font-medium">Conversions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {promos.data.channels.map((channel) => (
                      <tr key={channel.entityType}>
                        <td className="py-3 pr-4 font-medium capitalize">{channel.entityType}</td>
                        <td className="py-3 pr-4 tabular-nums">{channel.trackedEntities}</td>
                        <td className="py-3 pr-4 tabular-nums">{channel.impressions}</td>
                        <td className="py-3 pr-4 tabular-nums">{channel.clicks}</td>
                        <td className="py-3 pr-4 tabular-nums">{percent(channel.clickThroughRate)}</td>
                        <td className="py-3 tabular-nums">{channel.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
