"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Mail,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";
import { ChatsTab } from "@/components/account/chats-tab";
import { RequireLogin } from "@/components/auth/require-login";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { SellerCenter } from "@/components/vendor/seller-dashboard";
import { VendorCampaignsTab } from "@/components/vendor/vendor-campaigns-tab";
import { VendorCustomersTab } from "@/components/vendor/vendor-customers-tab";
import { VendorOrdersTab } from "@/components/vendor/vendor-orders-tab";
import { VendorProductsTab } from "@/components/vendor/vendor-products-tab";
import { VendorReviewsTab } from "@/components/vendor/vendor-reviews-tab";
import { VendorReturnsTab } from "@/components/vendor/vendor-returns-tab";
import { VendorStockTab } from "@/components/vendor/vendor-stock-tab";
import { VendorVouchersTab } from "@/components/vendor/vendor-vouchers-tab";
import { VendorWalletTab } from "@/components/vendor/vendor-wallet-tab";
import { useSession } from "@/hooks/use-auth";
import { useQueryParam } from "@/hooks/use-query-param";
import { useVendorProfile, useVendorStore } from "@/hooks/use-vendor";
import { cn } from "@/libs/cn";

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
  { id: "campaigns", label: "Campaigns" },
  { id: "wallet", label: "Wallet & Payouts" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((t) => t.id === value);
}

function StoreHeaderCard() {
  const user = useSession()?.user;
  const { data: profile } = useVendorProfile();
  const { store } = useVendorStore();

  const storeName = store?.store_name || profile?.store_name || profile?.business_name || "My Store";
  const initial = storeName.trim().charAt(0).toUpperCase() || user?.full_name.trim().charAt(0).toUpperCase() || "?";
  const email = user?.email || "vendor@odos.market";
  const category = profile?.business_category || "General Merchandising";
  const address = store?.address || `${store?.city || "Accra"}, ${store?.region || "Greater Accra"}`;
  const phone = profile?.phone_number || user?.phone_number || "Not provided";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-lg">{storeName}</p>
            <Badge tone="success">Verified Seller</Badge>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted">{email}</p>
          <p className="mt-0.5 text-xs text-muted">{category}</p>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs text-muted">
        <li className="flex items-center gap-1.5 sm:justify-end">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {address}
        </li>
        <li className="flex items-center gap-1.5 sm:justify-end">
          <Mail className="size-3.5 shrink-0" aria-hidden />
          {email}
        </li>
        <li className="flex items-center gap-1.5 sm:justify-end">
          <Phone className="size-3.5 shrink-0" aria-hidden />
          {phone}
        </li>
      </ul>
    </div>
  );
}

function VendorProfileTab() {
  const user = useSession()?.user;
  const { data: profile } = useVendorProfile();
  const { store, updateStoreAsync, isUpdating } = useVendorStore();

  const [editing, setEditing] = useState(false);
  const [storeName, setStoreName] = useState(store?.store_name || profile?.store_name || "");
  const [description, setDescription] = useState(store?.description || profile?.business_description || "");
  const [address, setAddress] = useState(store?.address || "");
  const [city, setCity] = useState(store?.city || "Accra");
  const [region, setRegion] = useState(store?.region || "Greater Accra");

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateStoreAsync({
        store_name: storeName.trim(),
        description: description.trim(),
        address: address.trim(),
        city: city.trim(),
        region: region.trim(),
      });
      toast.success("Store details updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update store details");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-normal">Business & Store Profile</h2>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5 mr-1.5" /> Edit details
            </Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={onSave} className="mt-5 space-y-4 border-t border-line/60 pt-4">
            <Field
              id="edit-store-name"
              label="Store Name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
            <Field
              id="edit-store-desc"
              label="Store Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                id="edit-store-addr"
                label="Street Address / Landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <Field
                id="edit-store-city"
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <Field
                id="edit-store-region"
                label="Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="accent" size="sm" disabled={isUpdating}>
                {isUpdating ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={isUpdating}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="mt-4 space-y-4 divide-y divide-line">
            {[
              ["Store name", store?.store_name || profile?.store_name || profile?.business_name || "My Store"],
              ["Business category", profile?.business_category || "General Merchandising"],
              ["Business email", user?.email || "Not provided"],
              ["Phone number", profile?.phone_number || user?.phone_number || "Not provided"],
              ["Store address", store?.address || "Oxford Street, Accra"],
              ["City & Region", `${store?.city || "Accra"}, ${store?.region || "Greater Accra"}`],
              ["Store status", profile?.status || "Active"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="truncate text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
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
        {tab === "stock" && <VendorStockTab />}
        {tab === "customers" && <VendorCustomersTab />}
        {tab === "returns" && <VendorReturnsTab />}
        {tab === "reviews" && <VendorReviewsTab />}
        {tab === "chats" && <ChatsTab />}
        {tab === "vouchers" && <VendorVouchersTab />}
        {tab === "campaigns" && <VendorCampaignsTab />}
        {tab === "wallet" && <VendorWalletTab />}
      </div>
    </div>
  );
}

export function VendorAccountView() {
  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Seller Center</h1>
      <RequireLogin next="/seller" message="Log in to view your Seller Center.">
        <VendorAccountTabs />
      </RequireLogin>
    </Container>
  );
}
