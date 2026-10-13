"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { toast } from "sonner";
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
import { MOCK_SELLER_STATS } from "@/mocks/vendor.mock";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const tileClass = "press flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface hover:border-foreground";
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
      <span className="grid size-10 place-items-center rounded-full border border-line text-foreground">
        <Plus className="size-4.5" aria-hidden />
      </span>
      <span className="text-xs font-medium">{label}</span>
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

function ManageRow({ label, icon: Icon, className }: { label: string; icon: LucideIcon; className?: string }) {
  return (
    <button type="button" onClick={() => toast(`${label} is coming soon`)} className={cn(manageRowClass, className)}>
      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

const QUICK_ACTIONS: { label: string; href?: string }[] = [
  { label: "Add" },
  { label: "Orders" },
  { label: "Products" },
  { label: "Stock" },
  { label: "Chats", href: "/account?tab=chats" },
  { label: "Wallet", href: "/account?tab=wallet" },
];

const MANAGE_ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: "Analytics", icon: BarChart3 },
  { label: "Sections", icon: LayoutGrid },
  { label: "Reviews", icon: Star },
  { label: "Customer", icon: Users },
  { label: "Vouchers", icon: Ticket },
  { label: "Campaigns", icon: Megaphone },
  { label: "Flash sales", icon: Zap },
  { label: "Returns", icon: Package },
  { label: "Store", icon: Store },
  { label: "Ops desk", icon: Headset },
];

/** The "Dashboard" tab of the Vendor Account page: today's stats, quick actions, and the manage menu. */
export function SellerCenter() {
  const stats = MOCK_SELLER_STATS;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-muted">{greeting()} · Seller Center</p>
          <button
            type="button"
            onClick={() => toast("Store settings are coming soon")}
            aria-label="Store settings"
            className="press grid size-9 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent-soft text-accent"
          >
            <Settings className="size-4" aria-hidden />
          </button>
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
          <TodayCard badge={`${stats.ordersRefundedToday} orders`} value={formatMoneyCompact(stats.todaySales)} label="Sales" />
          <TodayCard badge={`${stats.fulfilledPercent} done`} value={String(stats.todayOrders)} label="Orders" />
          <TodayCard badge="Act now" value={String(stats.toConfirmToday)} label="To confirm" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Quick actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionTile key={action.label} label={action.label} href={action.href} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Manage</h2>
        <div className="grid grid-cols-2 gap-3">
          {MANAGE_ITEMS.map(({ label, icon }) => (
            <ManageRow key={label} label={label} icon={icon} />
          ))}
        </div>
        <ManageRow label="Settings" icon={Settings} className="mt-3 w-full" />
      </section>
    </div>
  );
}
