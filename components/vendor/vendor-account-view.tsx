"use client";

import type { ReactNode } from "react";
import { Boxes, Mail, MapPin, PackageSearch, Phone, Star, Ticket } from "lucide-react";
import { ChatsTab } from "@/components/account/chats-tab";
import { WalletTab } from "@/components/account/wallet-tab";
import { RequireLogin } from "@/components/auth/require-login";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SellerCenter } from "@/components/vendor/seller-dashboard";
import { VendorCustomersTab } from "@/components/vendor/vendor-customers-tab";
import { VendorOrdersTab } from "@/components/vendor/vendor-orders-tab";
import { VendorProductsTab } from "@/components/vendor/vendor-products-tab";
import { useSession } from "@/hooks/use-auth";
import { useQueryParam } from "@/hooks/use-query-param";
import { cn } from "@/libs/cn";
import { useVendorStore, useVendorStatus } from "@/hooks/use-vendor";
import { ButtonLink } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";

/** ODOS's own support address, not something the store sets. */
const SUPPORT_EMAIL = "info@odos.market";

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
  const { data: profile, isPending } = useVendorStore();
  if (isPending || !profile) return <div className="h-32 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;

  const address = [profile.address, profile.city, profile.region].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <UserAvatar name={user?.full_name ?? "Vendor"} avatarUrl={user?.avatar_url} sizes="48px" className="size-12 text-lg" />
        <div className="min-w-0">
          <p className="font-semibold">{profile.storeName}</p>
          <p className="mt-0.5 truncate text-sm text-muted">{user?.email}</p>
          <p className="mt-0.5 text-xs text-muted">{profile.category}</p>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs text-muted">
        <li className="flex items-center gap-1.5 sm:justify-end">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {address || "No address set"}
        </li>
        <li className="flex items-center gap-1.5 sm:justify-end">
          <Mail className="size-3.5 shrink-0" aria-hidden />
          {SUPPORT_EMAIL}
        </li>
        <li className="flex items-center gap-1.5 sm:justify-end">
          <Phone className="size-3.5 shrink-0" aria-hidden />
          {profile.phone ?? "No phone set"}
        </li>
      </ul>
    </div>
  );
}

function VendorProfileTab() {
  const user = useSession()?.user;
  const { data: profile, isPending } = useVendorStore();

  if (isPending || !profile) return <div className="h-64 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Business profile</h2>
        <dl className="mt-4 space-y-4 divide-y divide-line">
          {[
            ["Store name", profile.storeName],
            ["Business email", user?.email ?? "—"],
            ["Category", profile.category],
            ["Store address", [profile.address, profile.city, profile.region].filter(Boolean).join(", ") || "—"],
            ["Support email", SUPPORT_EMAIL],
            ["Phone number", profile.phone ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="truncate text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Button type="button" variant="outline" disabled title="Editing your business profile is only in the ODOS app for now">
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
      title={`${label} isn’t on the website yet`}
      description={`Manage ${label.toLowerCase()} for your store in the ODOS app — it’s coming to the website.`}
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
        {tab === "orders" && <VendorOrdersTab />}
        {tab === "products" && <VendorProductsTab />}
        {tab === "stock" && <ComingSoonTab icon={<Boxes className="size-6 text-muted" aria-hidden />} label="Stock" />}
        {tab === "customers" && <VendorCustomersTab />}
        {tab === "returns" && <ComingSoonTab icon={<PackageSearch className="size-6 text-muted" aria-hidden />} label="Returns" />}
        {tab === "reviews" && <ComingSoonTab icon={<Star className="size-6 text-muted" aria-hidden />} label="Reviews" />}
        {tab === "chats" && <ChatsTab />}
        {tab === "vouchers" && <ComingSoonTab icon={<Ticket className="size-6 text-muted" aria-hidden />} label="Vouchers" />}
        {tab === "wallet" && <WalletTab />}
      </div>
    </div>
  );
}

/** Everything below the login wall still needs an approved vendor behind it. */
function VendorOnly() {
  const { isVendor, status } = useVendorStatus();

  if (!isVendor) {
    const pending = status === "pending" || status === "under_review";
    return (
      <EmptyState
        icon={<PackageSearch className="size-6 text-muted" aria-hidden />}
        iconBadge
        title={pending ? "Your vendor application is being reviewed" : "This is for ODOS vendors"}
        description={
          pending
            ? "We’ll email you as soon as it’s approved, and your Seller Center will open up here."
            : "Apply to sell on ODOS and your Seller Center will appear here once you’re approved."
        }
        action={<ButtonLink href="/account?tab=vendor">{pending ? "View application" : "Become a vendor"}</ButtonLink>}
      />
    );
  }

  return <VendorAccountTabs />;
}

export function VendorAccountView() {
  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Vendor Account</h1>
      <RequireLogin next="/seller" message="Log in to view your Seller Center.">
        <VendorOnly />
      </RequireLogin>
    </Container>
  );
}
