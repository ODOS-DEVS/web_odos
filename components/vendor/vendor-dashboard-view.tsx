"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CircleDollarSign,
  PackageX,
  Receipt,
  ShoppingBag,
  Star,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { VendorStatusBadge } from "@/components/vendor/vendor-status-badge";
import { TrendChart } from "@/components/vendor/charts/trend-chart";
import { PageHeader, Panel, PanelHeader, SegmentedControl, StatCard, StatGridSkeleton } from "@/components/vendor/vendor-ui";
import { formatDate, formatMoney, formatMoneyCompact } from "@/libs/format";
import { countVendorOrdersByQueue, filterVendorOrdersByQueue } from "@/libs/vendor-orders";
import { useVendorAnalytics, useVendorDashboard, useVendorOrders } from "@/hooks/use-vendor";
import type { VendorAnalyticsPeriod } from "@/types/vendor";

const PERIODS: { value: VendorAnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** A thing the vendor should go and do, shown only when the count is non-zero. */
function ActionRow({ href, icon, label, count, tone }: { href: string; icon: React.ReactNode; label: string; count: number; tone: "danger" | "warning" | "accent" }) {
  const ring = { danger: "text-danger bg-danger-soft", warning: "text-warning bg-warning-soft", accent: "text-accent bg-accent-soft" }[tone];
  return (
    <Link href={href} className="press flex items-center gap-3 px-5 py-3.5 hover:bg-surface-muted">
      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${ring}`}>{icon}</span>
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      <span className="shrink-0 text-sm font-bold tabular-nums">{count}</span>
      <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}

export function VendorDashboardView() {
  const [period, setPeriod] = useState<VendorAnalyticsPeriod>("30d");
  const [metric, setMetric] = useState<"sales" | "orders">("sales");

  const dashboard = useVendorDashboard();
  const analytics = useVendorAnalytics(period);
  const ordersQuery = useVendorOrders();

  if (dashboard.isError) {
    return <QueryError title="We couldn't load your dashboard" error={dashboard.error} onRetry={() => dashboard.refetch()} />;
  }

  const d = dashboard.data;
  const orders = ordersQuery.data ?? [];
  const queues = countVendorOrdersByQueue(orders);
  const recent = filterVendorOrdersByQueue(orders, "new").slice(0, 5);

  const actions = d
    ? [
        { href: "/seller/orders", icon: <ShoppingBag className="size-4" aria-hidden />, label: "Orders awaiting confirmation", count: d.pendingOrders, tone: "danger" as const },
        { href: "/seller/orders", icon: <Boxes className="size-4" aria-hidden />, label: "Orders being prepared", count: d.processingOrders, tone: "accent" as const },
        { href: "/seller/inventory", icon: <PackageX className="size-4" aria-hidden />, label: "Products out of stock", count: d.outOfStockCount, tone: "danger" as const },
        { href: "/seller/inventory", icon: <TriangleAlert className="size-4" aria-hidden />, label: "Products running low", count: d.lowStockCount, tone: "warning" as const },
      ].filter((a) => a.count > 0)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={d ? d.storeName : "Your store"}
        description={`${greeting()} — here's how your business is doing.`}
        actions={
          <>
            {d?.isOnVacation && <Badge tone="warning">Vacation mode on</Badge>}
            <ButtonLink href="/seller/products/new" size="sm">
              Add product
            </ButtonLink>
          </>
        }
      />

      {dashboard.isPending || !d ? (
        <StatGridSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total sales"
            value={formatMoneyCompact(d.totalSales)}
            hint={`${formatMoneyCompact(d.todaySales)} today`}
            icon={<CircleDollarSign className="size-4" aria-hidden />}
          />
          <StatCard
            label="Available balance"
            value={formatMoneyCompact(d.availableBalance)}
            hint={d.pendingWithdrawalBalance > 0 ? `${formatMoneyCompact(d.pendingWithdrawalBalance)} pending payout` : "Ready to withdraw"}
            icon={<Receipt className="size-4" aria-hidden />}
            tone="success"
          />
          <StatCard
            label="Orders to action"
            value={queues.new}
            hint={`${d.completedOrders} completed all time`}
            icon={<ShoppingBag className="size-4" aria-hidden />}
            tone={queues.new > 0 ? "danger" : "default"}
          />
          <StatCard
            label="Customers"
            value={d.customerCount}
            hint={d.avgRating ? `${d.avgRating.toFixed(1)}★ from ${d.reviewCount} reviews` : "No reviews yet"}
            icon={<Users className="size-4" aria-hidden />}
          />
        </div>
      )}

      <Panel>
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">{metric === "sales" ? "Revenue" : "Orders"} trend</h3>
            {analytics.data && (
              <p className="mt-0.5 text-xs text-muted">
                {metric === "sales"
                  ? `${formatMoney(analytics.data.periodSales)} over ${period.replace("d", " days")}`
                  : `${analytics.data.periodOrders} orders over ${period.replace("d", " days")}`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              label="Metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "sales", label: "Revenue" },
                { value: "orders", label: "Orders" },
              ]}
            />
            <SegmentedControl label="Period" value={period} onChange={setPeriod} options={PERIODS} />
          </div>
        </div>
        <div className="p-5">
          {analytics.isPending ? (
            <div className="h-56 animate-pulse rounded-xl bg-surface-muted" aria-busy="true" />
          ) : analytics.isError ? (
            <QueryError title="We couldn't load your sales" error={analytics.error} onRetry={() => analytics.refetch()} />
          ) : (
            <TrendChart points={analytics.data?.dailyPoints ?? []} metric={metric} />
          )}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Needs your attention" />
          {actions.length > 0 ? (
            <div className="divide-y divide-line">
              {actions.map((action) => (
                <ActionRow key={action.label} {...action} />
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted">
              <BadgeCheck className="size-4 text-success" aria-hidden />
              Nothing needs you right now. Your store is all caught up.
            </p>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Catalogue health"
            action={
              <Link href="/seller/products" className="press text-xs font-medium text-accent">
                Manage
              </Link>
            }
          />
          {d && (
            <dl className="divide-y divide-line">
              {[
                ["Total products", d.totalProducts, null],
                ["Active and visible", d.activeProducts, null],
                ["Running low", d.lowStockCount, d.lowStockCount > 0 ? "warning" : null],
                ["Out of stock", d.outOfStockCount, d.outOfStockCount > 0 ? "danger" : null],
                ["Active vouchers", d.activeVoucherCount, null],
              ].map(([label, value, tone]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3 px-5 py-3">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className={`text-sm font-semibold tabular-nums ${tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : ""}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="New orders"
            action={
              <Link href="/seller/orders" className="press text-xs font-medium text-accent">
                View all
              </Link>
            }
          />
          {recent.length > 0 ? (
            <ul className="divide-y divide-line">
              {recent.map((order) => (
                <li key={order.id}>
                  <Link href={`/seller/orders/${order.id}`} className="press flex items-center gap-3 px-5 py-3.5 hover:bg-surface-muted">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {order.number} · {order.buyerName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{formatDate(order.placedAt)}</p>
                    </div>
                    <VendorStatusBadge status={order.status} />
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(order.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">No new orders waiting. They&apos;ll appear here as customers check out.</p>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Best sellers"
            action={
              <Link href="/seller/analytics" className="press text-xs font-medium text-accent">
                Analytics
              </Link>
            }
          />
          {analytics.data?.topProducts.length ? (
            <ul className="divide-y divide-line">
              {analytics.data.topProducts.slice(0, 5).map((product) => (
                <li key={product.productId} className="flex items-center gap-3 px-5 py-3.5">
                  <Media src={product.imageUrl} name={product.name} sizes="36px" className="size-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{product.unitsSold} sold</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(product.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted">
              <Star className="size-4" aria-hidden />
              No sales in this period yet.
            </p>
          )}
        </Panel>
      </div>

      {d && d.totalCommission > 0 && (
        <p className="flex items-center gap-2 text-xs text-muted">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          {formatMoney(d.totalCommission)} of platform commission has been deducted from your lifetime earnings of{" "}
          {formatMoney(d.lifetimeEarnings)}.
        </p>
      )}
    </div>
  );
}
