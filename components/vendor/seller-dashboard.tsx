"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  CreditCard,
  Headset,
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
import { cn } from "@/libs/cn";
import { formatMoneyCompact } from "@/libs/format";
import { useSellerStats } from "@/hooks/use-vendor";

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
    <span
      aria-disabled="true"
      title={`${label} is only in the ODOS app for now`}
      className={cn(tileClass, "cursor-not-allowed opacity-50")}
    >
      {content}
    </span>
  );
}

/**
 * A row in the manage menu. Entries the website actually has navigate; the rest are shown as
 * plainly unavailable rather than looking clickable and answering with a toast.
 */
function ManageRow({ label, icon: Icon, href, className }: { label: string; icon: LucideIcon; href?: string; className?: string }) {
  const content = (
    <>
      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(manageRowClass, className)}>
        {content}
      </Link>
    );
  }

  return (
    <span
      aria-disabled="true"
      title={`${label} is only in the ODOS app for now`}
      className={cn(manageRowClass, "cursor-not-allowed opacity-50", className)}
    >
      {content}
    </span>
  );
}

// Everything here stays inside the Seller Center at /seller — /account is the
// shopper's page, and sending a vendor's "Orders" click to their own shopping
// history is how these links were originally broken.
const QUICK_ACTIONS: { label: string; href?: string }[] = [
  { label: "Add", href: "/seller?tab=products" },
  { label: "Orders", href: "/seller?tab=orders" },
  { label: "Products", href: "/seller?tab=products" },
  { label: "Stock", href: "/seller?tab=stock" },
  { label: "Chats", href: "/seller?tab=chats" },
  { label: "Wallet", href: "/seller?tab=wallet" },
];

const MANAGE_ITEMS: { label: string; icon: LucideIcon; href?: string }[] = [
  { label: "Analytics", icon: BarChart3 },
  { label: "Sections", icon: LayoutGrid },
  { label: "Reviews", icon: Star, href: "/seller?tab=reviews" },
  { label: "Customer", icon: Users, href: "/seller?tab=customers" },
  { label: "Vouchers", icon: Ticket, href: "/seller?tab=vouchers" },
  { label: "Campaigns", icon: Megaphone },
  { label: "Flash sales", icon: Zap },
  { label: "Returns", icon: Package, href: "/seller?tab=returns" },
  { label: "Store", icon: Store },
  { label: "Ops desk", icon: Headset },
];

/** The "Dashboard" tab of the Vendor Account page: today's stats, quick actions, and the manage menu. */
export function SellerCenter() {
  const { stats, isPending } = useSellerStats();

  if (isPending || !stats) {
    return (
      <div className="space-y-5" aria-busy="true">
        <div className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-muted">{greeting()} · Seller Center</p>
          <span
            aria-disabled="true"
            aria-label="Store settings"
            title="Store settings are only in the ODOS app for now"
            className="grid size-9 shrink-0 cursor-not-allowed place-items-center rounded-full border border-accent/40 bg-accent-soft text-accent opacity-50"
          >
            <Settings className="size-4" aria-hidden />
          </span>
        </div>
        <p className="mt-1 text-2xl font-bold">{stats.storeName}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="neutral">Seller Center</Badge>
          <Badge tone="neutral">Live storefront</Badge>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold">Needs attention</h2>
        <div className="grid grid-cols-2 gap-3">
          <AttentionCard value={stats.awaitingConfirmation} label="Awaiting confirmation" />
          <AttentionCard value={stats.awaitingShipment} label="Awaiting shipment" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Today</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TodayCard badge={`${stats.weekOrders} this week`} value={formatMoneyCompact(stats.todaySales)} label="Sales" />
          <TodayCard badge={`${stats.fulfilledPercent}% done`} value={String(stats.todayOrders)} label="Orders" />
          <TodayCard badge={stats.openReturns > 0 ? "Act now" : "All clear"} value={String(stats.openReturns)} label="Open returns" />
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
        <ManageRow label="Settings" icon={Settings} className="mt-3 w-full" />
      </section>
    </div>
  );
}
