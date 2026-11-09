"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  LayoutGrid,
  Megaphone,
  Package,
  Plus,
  Settings,
  Star,
  Store,
  Ticket,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useVendorDashboard, useVendorProfile } from "@/hooks/use-vendor";
import { cn } from "@/libs/cn";
import { formatMoneyCompact } from "@/libs/format";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const tileClass = "press flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface py-3 hover:border-foreground";
const manageRowClass = "press flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left hover:border-foreground";

function AttentionCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-danger-soft p-5">
      <p className="text-3xl font-bold text-danger tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

function TodayCard({ badge, value, label }: { badge: string; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <CreditCard className="size-4" aria-hidden />
        </span>
        <span className="text-[11px] text-muted">{badge}</span>
      </div>
      <p className="mt-3 text-xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

function QuickActionTile({ label, href }: { label: string; href?: string }) {
  const content: ReactNode = (
    <>
      <span className="grid size-9 place-items-center rounded-full border border-line text-foreground">
        <Plus className="size-4" aria-hidden />
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={tileClass}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => toast(`${label} is coming soon`)} className={tileClass}>
      {content}
    </button>
  );
}

function ManageRow({ label, icon: Icon, href, className }: { label: string; icon: LucideIcon; href?: string; className?: string }) {
  if (href) {
    return (
      <Link href={href} className={cn(manageRowClass, className)}>
        <Icon className="size-4 shrink-0 text-muted" aria-hidden />
        <span className="text-sm font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => toast(`${label} is coming soon`)} className={cn(manageRowClass, className)}>
      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

const QUICK_ACTIONS: { label: string; href?: string }[] = [
  { label: "Add", href: "/account?tab=products&new=1" },
  { label: "Orders", href: "/account?tab=orders" },
  { label: "Products", href: "/account?tab=products" },
  { label: "Customers", href: "/account?tab=customers" },
  { label: "Chats", href: "/account?tab=chats" },
  { label: "Wallet", href: "/account?tab=wallet" },
];

const MANAGE_ITEMS: { label: string; icon: LucideIcon; href?: string }[] = [
  { label: "Orders", icon: Package, href: "/account?tab=orders" },
  { label: "Products", icon: LayoutGrid, href: "/account?tab=products" },
  { label: "Customers", icon: Users, href: "/account?tab=customers" },
  { label: "Wallet & Payouts", icon: CreditCard, href: "/account?tab=wallet" },
  { label: "Vouchers", icon: Ticket, href: "/account?tab=vouchers" },
  { label: "Reviews", icon: Star, href: "/account?tab=reviews" },
  { label: "Returns", icon: Package, href: "/account?tab=returns" },
  { label: "Campaigns", icon: Megaphone },
  { label: "Flash sales", icon: Zap },
  { label: "Store Sections", icon: Store },
];

export function SellerDashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading seller dashboard">
      <div className="rounded-2xl border border-line bg-surface p-5 animate-pulse">
        <div className="h-4 w-36 rounded bg-surface-muted" />
        <div className="mt-3 h-8 w-60 rounded-md bg-surface-muted" />
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-24 rounded-full bg-surface-muted" />
          <div className="h-6 w-24 rounded-full bg-surface-muted" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-surface-muted" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl bg-surface-muted animate-pulse" />
          <div className="h-24 rounded-2xl bg-surface-muted animate-pulse" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-5 w-24 rounded bg-surface-muted" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-surface-muted animate-pulse" />
          <div className="h-28 rounded-2xl bg-surface-muted animate-pulse" />
          <div className="h-28 rounded-2xl bg-surface-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/** The "Dashboard" tab of the Vendor Account page: live stats from GET /vendor/dashboard. */
export function SellerCenter() {
  const { data: dashboard, isLoading: isDashboardLoading } = useVendorDashboard();
  const { data: profile, isLoading: isProfileLoading } = useVendorProfile();

  if (isDashboardLoading && isProfileLoading) {
    return <SellerDashboardSkeleton />;
  }

  const storeName = dashboard?.store_name || profile?.store_name || profile?.business_name || "My Store";
  const awaitingConfirmation = dashboard?.pending_orders ?? 0;
  const awaitingShipment = dashboard?.processing_orders ?? 0;
  const todaySales = dashboard?.today_sales ?? 0;
  const todayOrders = dashboard?.today_orders ?? 0;
  const toConfirmToday = dashboard?.pending_orders ?? 0;
  const ordersRefundedToday = dashboard?.cancelled_orders ?? 0;
  const totalProducts = dashboard?.total_products ?? 0;
  const activeProducts = dashboard?.active_products ?? 0;
  const fulfilledPercent = totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 100;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-muted">{greeting()} · Seller Center</p>
          <button
            type="button"
            onClick={() => toast("Store profile can be edited in the Profile tab")}
            aria-label="Store settings"
            className="press grid size-9 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent-soft text-accent"
          >
            <Settings className="size-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-2xl font-bold">{storeName}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="neutral">Seller Center</Badge>
          <Badge tone="success">Live storefront</Badge>
          {dashboard?.vendor_status && (
            <Badge tone="accent" className="capitalize">{dashboard.vendor_status}</Badge>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold">Needs attention</h2>
        <div className="grid grid-cols-2 gap-3">
          <AttentionCard value={awaitingConfirmation} label="Awaiting confirmation" />
          <AttentionCard value={awaitingShipment} label="Awaiting shipment" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Today</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TodayCard badge={`${ordersRefundedToday} cancelled`} value={formatMoneyCompact(todaySales)} label="Sales" />
          <TodayCard badge={`${fulfilledPercent}% active`} value={String(todayOrders)} label="Today's orders" />
          <TodayCard badge="Act now" value={String(toConfirmToday)} label="To confirm" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Quick actions</h2>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionTile key={action.label} label={action.label} href={action.href} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Manage</h2>
        <div className="grid grid-cols-2 gap-3">
          {MANAGE_ITEMS.map(({ label, icon, href }) => (
            <ManageRow key={label} label={label} icon={icon} href={href} />
          ))}
        </div>
      </section>
    </div>
  );
}
