"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import type { UserRead, UserUpdate } from "@/types/api";
import { PaymentMethodsTab } from "@/components/account/payment-methods-tab";
import { WalletTab } from "@/components/account/wallet-tab";
import { RequireLogin } from "@/components/auth/require-login";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field, inputClass } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
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

const GENDERS = ["Prefer not to say", "Male", "Female"] as const;

/** Splits a single `full_name` into first/last for the editable fields; recombined on submit. */
function splitName(fullName: string) {
  const [first = "", ...rest] = fullName.trim().split(/\s+/);
  return { first, last: rest.join(" ") };
}

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
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { first, last } = splitName(user.full_name);
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [otherNames, setOtherNames] = useState(user.other_names ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const [dateOfBirth, setDateOfBirth] = useState(user.date_of_birth ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [phone, setPhone] = useState(user.phone_number ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [region, setRegion] = useState(user.region ?? "Greater Accra");
  const [allowNotifications, setAllowNotifications] = useState(user.allow_notifications);
  const [orderNotifications, setOrderNotifications] = useState(user.vendor_order_notifications);
  const [discountNotifications, setDiscountNotifications] = useState(user.discount_notifications);
  const [storeNotifications, setStoreNotifications] = useState(user.store_notifications);
  const [systemNotifications, setSystemNotifications] = useState(user.system_notifications);
  const [locationNotifications, setLocationNotifications] = useState(user.location_notifications);
  const [locationUpdates, setLocationUpdates] = useState(user.location_updates);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(user.personalization_enabled);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(user.analytics_enabled);
  const [socialSharingEnabled, setSocialSharingEnabled] = useState(user.social_sharing_enabled ?? true);

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: UserUpdate = {
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      other_names: otherNames.trim() || null,
      avatar_url: avatarUrl,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      phone_number: phone.trim() || null,
      city: city.trim() || null,
      region,
      allow_notifications: allowNotifications,
      vendor_order_notifications: orderNotifications,
      discount_notifications: discountNotifications,
      store_notifications: storeNotifications,
      system_notifications: systemNotifications,
      location_notifications: locationNotifications,
      location_updates: locationUpdates,
      personalization_enabled: personalizationEnabled,
      analytics_enabled: analyticsEnabled,
      social_sharing_enabled: socialSharingEnabled,
    };
    update.mutate(input, { onSuccess: () => toast.success("Profile updated") });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Personal details</h2>

        <div className="relative mt-5 mb-6 size-20">
          <Media src={avatarUrl} name={user.full_name} className="size-20 rounded-full" imgClassName="object-cover" sizes="80px" />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            aria-label="Change profile photo"
            className="press absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-surface text-foreground ring-1 ring-line"
          >
            <Camera className="size-3.5" aria-hidden />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarChange} className="sr-only" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="firstName" label="First name" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Field id="lastName" label="Last name" autoComplete="family-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Field id="otherNames" label="Other names" autoComplete="additional-name" value={otherNames} onChange={(e) => setOtherNames(e.target.value)} />
          <Field id="email" label="Email" hint="Contact support to change" type="email" value={user.email} disabled />
          <Field id="dateOfBirth" label="Date of birth" type="date" autoComplete="bday" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          <Field id="phone" label="Phone number" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div>
            <label htmlFor="gender" className="mb-1.5 block text-sm font-medium">
              Gender
            </label>
            <select id="gender" name="gender" value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
              <option value="" disabled>
                Select
              </option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
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
          <Field id="city" label="Town / city" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Notifications</h2>
        <p className="mt-1 text-sm text-muted">
          Order and account events always appear in Activity. These toggles control push alerts on this marketplace.
        </p>
        <div className="mt-3 divide-y divide-line">
          <Switch
            checked={allowNotifications}
            onChange={setAllowNotifications}
            label="Allow notifications"
            description="Master switch for ODOS push alerts"
          />
          <Switch
            checked={orderNotifications}
            onChange={setOrderNotifications}
            label="New order alerts"
            description="Custom sound, vibration, push, and repeat reminders until you fulfil the order"
          />
          <Switch
            checked={discountNotifications}
            onChange={setDiscountNotifications}
            label="Deals & vouchers"
            description="Sales and limited-time offers"
          />
          <Switch
            checked={storeNotifications}
            onChange={setStoreNotifications}
            label="Store messages"
            description="Vendor chat and store updates"
          />
          <Switch
            checked={systemNotifications}
            onChange={setSystemNotifications}
            label="System updates"
            description="Security and account notices"
          />
          <Switch
            checked={locationNotifications}
            onChange={setLocationNotifications}
            label="Location alerts"
            description="Delivery and location reminders"
          />
          <Switch
            checked={locationUpdates}
            onChange={setLocationUpdates}
            label="Live location updates"
            description="Smoother delivery tracking when enabled"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Preferences</h2>
        <p className="mt-1 text-sm text-muted">
          Control recommendations, privacy-friendly analytics, and how ODOS personalizes what you see
        </p>
        <div className="mt-3 divide-y divide-line">
          <Switch
            checked={personalizationEnabled}
            onChange={setPersonalizationEnabled}
            label="Personalized picks"
            description="Tailor home and category suggestions based on your browsing and orders."
          />
          <Switch
            checked={analyticsEnabled}
            onChange={setAnalyticsEnabled}
            label="Analytics"
            description="Help ODOS learn what you browse, save, and buy so recommendations improve over time"
          />
          <Switch
            checked={socialSharingEnabled}
            onChange={setSocialSharingEnabled}
            label="Social sharing cookies"
            description="Enable share-to-social features when you choose to post products"
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
    <Container className="max-w-4xl py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Your profile</h1>
      <RequireLogin next="/account" message="Log in to view and update your profile.">
        <ProfileTabs />
      </RequireLogin>
    </Container>
  );
}
