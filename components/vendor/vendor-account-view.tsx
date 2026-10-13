"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { Boxes, Mail, MapPin, Package, PackageSearch, Phone, Star, Ticket, Users } from "lucide-react";
import { ChatsTab } from "@/components/account/chats-tab";
import { WalletTab } from "@/components/account/wallet-tab";
import { RequireLogin } from "@/components/auth/require-login";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SellerCenter } from "@/components/vendor/seller-dashboard";
import { useSession } from "@/hooks/use-auth";
import { useQueryParam } from "@/hooks/use-query-param";
import { cn } from "@/libs/cn";
import { MOCK_SELLER_PROFILE } from "@/mocks/vendor.mock";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products" },
  { id: "stock", label: "Stock" },
  { id: "customers", label: "Customers" },
  { id: "returns", label: "Returns" },
  { id: "reviews", label: "Reviews" },
  { id: "chats", label: "Chats" },
  { id: "vouchers", label: "Vouchers" },
  { id: "wallet", label: "Wallet" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((t) => t.id === value);
}

function StoreHeaderCard() {
  const user = useSession()?.user;
  const profile = MOCK_SELLER_PROFILE;
  const initial = user?.full_name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-lg font-semibold text-accent">{initial}</span>
        <div className="min-w-0">
          <p className="font-semibold">{profile.storeName}</p>
          <p className="mt-0.5 truncate text-sm text-muted">{profile.email}</p>
          <p className="mt-0.5 text-xs text-muted">{profile.businessType}</p>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs text-muted">
        <li className="flex items-center gap-1.5 sm:justify-end">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {profile.address}
        </li>
        <li className="flex items-center gap-1.5 sm:justify-end">
          <Mail className="size-3.5 shrink-0" aria-hidden />
          {profile.supportEmail}
        </li>
        <li className="flex items-center gap-1.5 sm:justify-end">
          <Phone className="size-3.5 shrink-0" aria-hidden />
          {profile.phone}
        </li>
      </ul>
    </div>
  );
}

function VendorProfileTab() {
  const profile = MOCK_SELLER_PROFILE;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Business profile</h2>
        <dl className="mt-4 space-y-4 divide-y divide-line">
          {[
            ["Store name", profile.storeName],
            ["Business email", profile.email],
            ["Business type", profile.businessType],
            ["Store address", profile.address],
            ["Support email", profile.supportEmail],
            ["Phone number", profile.phone],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="truncate text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Button type="button" variant="outline" onClick={() => toast("Editing your business profile is coming soon")}>
        Edit profile
      </Button>
    </div>
  );
}

function ComingSoonTab({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <EmptyState
      icon={icon}
      iconBadge
      title={`${label} is coming soon`}
      description={`We're still building out ${label.toLowerCase()} management for your store. Check back soon.`}
    />
  );
}

function VendorAccountTabs() {
  const [tabParam, setTabParam] = useQueryParam("tab");
  const tab: TabId = isTabId(tabParam) ? tabParam : "dashboard";
  const setTab = (next: TabId) => setTabParam(next === "dashboard" ? null : next);

  return (
    <div className="space-y-6">
      <StoreHeaderCard />

      <div role="tablist" className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "press shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors",
              tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "profile" && <VendorProfileTab />}
        {tab === "dashboard" && <SellerCenter />}
        {tab === "orders" && <ComingSoonTab icon={<Package className="size-6 text-muted" aria-hidden />} label="Orders" />}
        {tab === "products" && <ComingSoonTab icon={<Boxes className="size-6 text-muted" aria-hidden />} label="Products" />}
        {tab === "stock" && <ComingSoonTab icon={<Boxes className="size-6 text-muted" aria-hidden />} label="Stock" />}
        {tab === "customers" && <ComingSoonTab icon={<Users className="size-6 text-muted" aria-hidden />} label="Customers" />}
        {tab === "returns" && <ComingSoonTab icon={<PackageSearch className="size-6 text-muted" aria-hidden />} label="Returns" />}
        {tab === "reviews" && <ComingSoonTab icon={<Star className="size-6 text-muted" aria-hidden />} label="Reviews" />}
        {tab === "chats" && <ChatsTab />}
        {tab === "vouchers" && <ComingSoonTab icon={<Ticket className="size-6 text-muted" aria-hidden />} label="Vouchers" />}
        {tab === "wallet" && <WalletTab />}
      </div>
    </div>
  );
}

export function VendorAccountView() {
  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Vendor Account</h1>
      <RequireLogin next="/seller" message="Log in to view your Seller Center.">
        <VendorAccountTabs />
      </RequireLogin>
    </Container>
  );
}
