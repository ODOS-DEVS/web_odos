"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { UserRead, UserUpdate } from "@/types/api";
import { PaymentMethodsTab } from "@/components/account/payment-methods-tab";
import { WalletTab } from "@/components/account/wallet-tab";
import { RequireLogin } from "@/components/auth/require-login";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field, inputClass } from "@/components/ui/field";
import { useSession } from "@/hooks/use-auth";
import { GHANA_REGIONS } from "@/libs/checkout";
import { cn } from "@/libs/cn";
import { formatDate } from "@/libs/format";
import { mockUpdateMe } from "@/mocks/auth.mock";
import { useFakeMutation } from "@/mocks/mutation";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "payment", label: "Payment methods" },
  { id: "wallet", label: "Wallet" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (next: boolean) => void; label: string; description: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3.5">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "press relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-surface-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </label>
  );
}

function ProfileDetailsForm({ user }: { user: UserRead }) {
  const update = useFakeMutation(mockUpdateMe);

  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone_number ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [region, setRegion] = useState(user.region ?? "Greater Accra");
  const [allowNotifications, setAllowNotifications] = useState(user.allow_notifications);
  const [discountNotifications, setDiscountNotifications] = useState(user.discount_notifications);
  const [storeNotifications, setStoreNotifications] = useState(user.store_notifications);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: UserUpdate = {
      full_name: fullName.trim(),
      phone_number: phone.trim() || null,
      city: city.trim() || null,
      region,
      allow_notifications: allowNotifications,
      discount_notifications: discountNotifications,
      store_notifications: storeNotifications,
    };
    update.mutate(input, { onSuccess: () => toast.success("Profile updated") });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Personal details</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="fullName" label="Full name" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Field id="phone" label="Phone number" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Field
            id="email"
            label="Email"
            hint="Contact support to change"
            type="email"
            value={user.email}
            disabled
          />
          <Field id="city" label="City or town" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
          <div>
            <label htmlFor="region" className="mb-1.5 block text-sm font-medium">
              Region
            </label>
            <select id="region" name="region" value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
              {GHANA_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Notifications</h2>
        <div className="mt-1 divide-y divide-line">
          <Switch
            checked={allowNotifications}
            onChange={setAllowNotifications}
            label="Push notifications"
            description="Order updates and delivery status, right as they happen."
          />
          <Switch
            checked={discountNotifications}
            onChange={setDiscountNotifications}
            label="Deals and discounts"
            description="Hear about flash sales and vendor offers."
          />
          <Switch
            checked={storeNotifications}
            onChange={setStoreNotifications}
            label="Store updates"
            description="New arrivals from stores you’ve ordered from before."
          />
        </div>
      </section>

      <Button type="submit" size="lg" variant="accent" className="w-full sm:w-auto" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function ProfileTabs() {
  const user = useSession()?.user;
  const [tab, setTab] = useState<TabId>("profile");

  // Only ever mounts inside `RequireLogin`'s authenticated branch, so `user` is always set here.
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-soft text-xl font-semibold text-accent">
          {user.full_name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{user.full_name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-muted">Member since {formatDate(user.created_at)}</p>
        </div>
      </div>

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

      <div className="mt-6">
        {tab === "profile" && <ProfileDetailsForm user={user} />}
        {tab === "payment" && <PaymentMethodsTab />}
        {tab === "wallet" && <WalletTab />}
      </div>
    </div>
  );
}

export function ProfileView() {
  return (
    <Container className="max-w-2xl py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Your profile</h1>
      <RequireLogin next="/account" message="Log in to view and update your profile.">
        <ProfileTabs />
      </RequireLogin>
    </Container>
  );
}
