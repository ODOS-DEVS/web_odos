"use client";

import { Suspense, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, BadgeCheck, Camera, KeyRound, Loader2, Trash2 } from "lucide-react";
import type { UserRead, UserUpdate } from "@/types/api";
import { AddressTab } from "@/components/account/address-tab";
import { ChatsTab } from "@/components/account/chats-tab";
import { HelpSupportTab } from "@/components/account/help-support-tab";
import { LoyaltyTab } from "@/components/account/loyalty-tab";
import { PaymentMethodsTab } from "@/components/account/payment-methods-tab";
import { ProfileSkeleton } from "@/components/account/profile-skeleton";
import { ReturnsTab } from "@/components/account/returns-tab";
import { ReviewsTab } from "@/components/account/reviews-tab";
import { VendorTab } from "@/components/account/vendor-tab";
import { SellerCenter } from "@/components/vendor/seller-dashboard";
import { VendorCustomersTab } from "@/components/vendor/vendor-customers-tab";
import { VendorOrdersTab } from "@/components/vendor/vendor-orders-tab";
import { VendorProductsTab } from "@/components/vendor/vendor-products-tab";
import { VouchersTab } from "@/components/account/vouchers-tab";
import { WalletTab } from "@/components/account/wallet-tab";
import { RequireLogin } from "@/components/auth/require-login";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Container } from "@/components/ui/container";
import { DatePickerField } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select";
import { Media } from "@/components/ui/media";
import {
  useEmailPreferences,
  useUpdateEmailPreferences,
  useDeleteAccount,
} from "@/hooks/use-account-security";
import { useCurrentUser, useSession, useUpdateProfile } from "@/hooks/use-auth";
import { GHANA_REGIONS } from "@/libs/checkout";
import { cn } from "@/libs/cn";
import { formatDate } from "@/libs/format";
import { optionalGhanaPhoneSchema } from "@/libs/validators";
import { accountSecurityService, type EmailPreferencesRead } from "@/services/account-security.service";
import { canUploadPhotos, uploadPhoto } from "@/services/upload.service";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "address", label: "Addresses" },
  { id: "payment", label: "Payment methods" },
  { id: "wallet", label: "Wallet" },
  { id: "loyalty", label: "Loyalty Points" },
  { id: "vouchers", label: "Vouchers" },
  { id: "reviews", label: "Reviews" },
  { id: "chats", label: "Chats" },
  { id: "returns", label: "Returns" },
  { id: "help", label: "Help & Support" },
  { id: "vendor", label: "Become a Vendor" },
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const GENDERS = ["Prefer not to say", "Male", "Female"] as const;

/**
 * The API stores one `full_name`. Split it into first / other names / last for editing ("Theophilus
 * Kanatey Dadzie" → first "Theophilus", other "Kanatey", last "Dadzie") and join it back on save, so
 * "Other names" is kept even though the API has no field of its own for it.
 */
function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] ?? "", other: "", last: "" };
  return { first: parts[0], other: parts.slice(1, -1).join(" "), last: parts[parts.length - 1] };
}

const joinName = (...parts: string[]) => parts.map((p) => p.trim()).filter(Boolean).join(" ");

/** "Theophilus Kanatey Dadzie" → "TD". */
function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "")).toUpperCase();
}

/** Match the API's free-text gender onto our options regardless of case ("male" → "Male"). */
const normaliseGender = (value: string | null) =>
  GENDERS.find((g) => g.toLowerCase() === (value ?? "").trim().toLowerCase()) ?? "";

/** The API has no field for this cookie preference, so it is remembered in this browser. */
const SOCIAL_SHARING_KEY = "odos-social-sharing";
function readSocialSharing() {
  try {
    return localStorage.getItem(SOCIAL_SHARING_KEY) !== "off";
  } catch {
    return true;
  }
}

function VerifiedHint({ verified, href }: { verified: boolean; href: string }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-success">
      <BadgeCheck className="size-3.5" aria-hidden /> Verified
    </span>
  ) : (
    <Link href={href} className="font-medium text-accent underline underline-offset-2">
      Verify
    </Link>
  );
}

function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 py-3.5 select-none transition-opacity",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-surface-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </label>
  );
}

function ProfileDetailsForm({ user }: { user: UserRead }) {
  const update = useUpdateProfile();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { first, other, last } = splitName(user.full_name);
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [otherNames, setOtherNames] = useState(other);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const [uploading, setUploading] = useState(false);
  // `<input type="date">` needs YYYY-MM-DD; tolerate a full timestamp from the API.
  const [dateOfBirth, setDateOfBirth] = useState((user.date_of_birth ?? "").slice(0, 10));
  const [gender, setGender] = useState<string>(normaliseGender(user.gender));
  const [phoneError, setPhoneError] = useState<string | null>(null);
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
  const [socialSharingEnabled, setSocialSharingEnabled] = useState(readSocialSharing);

  /** Uploads the photo first; the form then saves its URL with everything else. */
  const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      if (canUploadPhotos()) {
        const url = await uploadPhoto(file);
        setAvatarUrl(url);
        toast.success("Photo uploaded — save changes to keep it");
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setAvatarUrl(result);
          toast.success("Photo selected — save changes to keep it");
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /** Instantly saves a toggle preference to the backend via PATCH /auth/me and displays a status toast. */
  const handleTogglePreference = (
    field: keyof UserUpdate,
    currentValue: boolean,
    setter: (val: boolean) => void,
    label: string,
  ) => {
    const next = !currentValue;
    setter(next);
    update.mutate(
      { [field]: next },
      {
        onSuccess: () => {
          toast.success(`${label} ${next ? "enabled" : "disabled"}`);
        },
        onError: (err) => {
          setter(currentValue);
          toast.error(err instanceof Error ? err.message : `Failed to update ${label.toLowerCase()}`);
        },
      },
    );
  };

  const handleToggleSocialSharing = () => {
    const next = !socialSharingEnabled;
    setSocialSharingEnabled(next);
    try {
      localStorage.setItem(SOCIAL_SHARING_KEY, next ? "on" : "off");
      toast.success(`Social sharing cookies ${next ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Could not save cookie preference");
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phoneCheck = optionalGhanaPhoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      setPhoneError(phoneCheck.error.issues[0]?.message ?? "Enter a valid Ghana phone number");
      return;
    }
    setPhoneError(null);

    try {
      localStorage.setItem(SOCIAL_SHARING_KEY, socialSharingEnabled ? "on" : "off");
    } catch {
      // Storage blocked: the preference lasts until reload.
    }

    // Only fields the API's UserUpdate accepts; `avatar_url` is a URL (max 500 characters).
    const input: UserUpdate = {
      full_name: joinName(firstName, otherNames, lastName),
      avatar_url: avatarUrl && avatarUrl.length <= 500 ? avatarUrl : user.avatar_url,
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
    };
    update.mutate(input, {
      onSuccess: () => toast.success("Profile updated"),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Personal details</h2>

        <div className="relative mt-5 mb-6 size-20">
          {avatarUrl ? (
            <Media src={avatarUrl} name={user.full_name} className="size-20 rounded-full" imgClassName="object-cover" sizes="80px" />
          ) : (
            <span className="grid size-20 place-items-center rounded-full bg-accent text-2xl font-semibold text-accent-foreground" aria-hidden>
              {initials(joinName(firstName, otherNames, lastName) || user.full_name)}
            </span>
          )}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            className="press absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-surface text-foreground ring-1 ring-line"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Camera className="size-3.5" aria-hidden />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarChange} className="sr-only" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="firstName" label="First name" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Field id="lastName" label="Last name" autoComplete="family-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Field id="otherNames" label="Other names" autoComplete="additional-name" value={otherNames} onChange={(e) => setOtherNames(e.target.value)} />
          <Field
            id="email"
            label="Email"
            hint={user.is_verified ? "Contact support to change" : <VerifiedHint verified={false} href="/verify-email?next=/account" />}
            type="email"
            value={user.email}
            disabled
          />
          <DatePickerField id="dateOfBirth" label="Date of birth" value={dateOfBirth} onChange={setDateOfBirth} placeholder="Select your birthday" />
          <Field
            id="phone"
            label="Phone number"
            type="tel"
            autoComplete="tel"
            placeholder="024 123 4567"
            value={phone}
            error={phoneError ?? undefined}
            hint={
              phone.trim() && phone.trim() === (user.phone_number ?? "") ? (
                <VerifiedHint verified={user.phone_verified} href="/verify-phone?next=/account" />
              ) : undefined
            }
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneError(null);
            }}
          />
          <SelectField id="gender" label="Gender" value={gender} onValueChange={setGender} options={GENDERS} />
          <SelectField id="region" label="Region" value={region} onValueChange={setRegion} options={GHANA_REGIONS} />
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
            onChange={() =>
              handleTogglePreference(
                "allow_notifications",
                allowNotifications,
                setAllowNotifications,
                "Master notifications",
              )
            }
            label="Allow notifications"
            description="Master switch for ODOS push alerts"
            disabled={update.isPending}
          />
          <Switch
            checked={orderNotifications}
            onChange={() =>
              handleTogglePreference(
                "vendor_order_notifications",
                orderNotifications,
                setOrderNotifications,
                "New order alerts",
              )
            }
            label="New order alerts"
            description="Custom sound, vibration, push, and repeat reminders until you fulfil the order"
            disabled={update.isPending}
          />
          <Switch
            checked={discountNotifications}
            onChange={() =>
              handleTogglePreference(
                "discount_notifications",
                discountNotifications,
                setDiscountNotifications,
                "Deals & vouchers alerts",
              )
            }
            label="Deals & vouchers"
            description="Sales and limited-time offers"
            disabled={update.isPending}
          />
          <Switch
            checked={storeNotifications}
            onChange={() =>
              handleTogglePreference(
                "store_notifications",
                storeNotifications,
                setStoreNotifications,
                "Store messages alerts",
              )
            }
            label="Store messages"
            description="Vendor chat and store updates"
            disabled={update.isPending}
          />
          <Switch
            checked={systemNotifications}
            onChange={() =>
              handleTogglePreference(
                "system_notifications",
                systemNotifications,
                setSystemNotifications,
                "System updates",
              )
            }
            label="System updates"
            description="Security and account notices"
            disabled={update.isPending}
          />
          <Switch
            checked={locationNotifications}
            onChange={() =>
              handleTogglePreference(
                "location_notifications",
                locationNotifications,
                setLocationNotifications,
                "Location alerts",
              )
            }
            label="Location alerts"
            description="Delivery and location reminders"
            disabled={update.isPending}
          />
          <Switch
            checked={locationUpdates}
            onChange={() =>
              handleTogglePreference(
                "location_updates",
                locationUpdates,
                setLocationUpdates,
                "Live location tracking",
              )
            }
            label="Live location updates"
            description="Smoother delivery tracking when enabled"
            disabled={update.isPending}
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
            onChange={() =>
              handleTogglePreference(
                "personalization_enabled",
                personalizationEnabled,
                setPersonalizationEnabled,
                "Personalized picks",
              )
            }
            label="Personalized picks"
            description="Tailor home and category suggestions based on your browsing and orders."
            disabled={update.isPending}
          />
          <Switch
            checked={analyticsEnabled}
            onChange={() =>
              handleTogglePreference(
                "analytics_enabled",
                analyticsEnabled,
                setAnalyticsEnabled,
                "Analytics sharing",
              )
            }
            label="Analytics"
            description="Help ODOS learn what you browse, save, and buy so recommendations improve over time"
            disabled={update.isPending}
          />
          <Switch
            checked={socialSharingEnabled}
            onChange={handleToggleSocialSharing}
            label="Social sharing cookies"
            description="Enable share-to-social features when you choose to post products"
          />
        </div>
      </section>

      <Button type="submit" size="lg" variant="accent" className="w-full sm:w-auto" disabled={update.isPending || uploading}>
        {update.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function EmailPreferencesSection() {
  const { data: emailPrefs } = useEmailPreferences();
  const updatePrefs = useUpdateEmailPreferences();

  const handleToggle = (key: keyof EmailPreferencesRead, label: string) => {
    const current = emailPrefs ? emailPrefs[key] : false;
    const next = !current;
    updatePrefs.mutate(
      { [key]: next },
      {
        onSuccess: () => {
          toast.success(`${label} ${next ? "enabled" : "disabled"}`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : `Failed to update ${label.toLowerCase()}`);
        },
      },
    );
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Email notifications</h2>
          <p className="mt-1 text-sm text-muted">
            Manage the updates and announcements delivered directly to your inbox.
          </p>
        </div>
        {updatePrefs.isPending && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Loader2 className="size-3.5 animate-spin" /> Saving…
          </span>
        )}
      </div>
      <div className="mt-3 divide-y divide-line">
        <Switch
          checked={emailPrefs?.order_updates ?? true}
          onChange={() => handleToggle("order_updates", "Order update emails")}
          label="Order updates"
          description="Emails regarding order confirmation, dispatch, and delivery updates"
          disabled={updatePrefs.isPending}
        />
        <Switch
          checked={emailPrefs?.newsletter ?? false}
          onChange={() => handleToggle("newsletter", "ODOS Newsletter")}
          label="ODOS Newsletter"
          description="Bi-weekly curation of trending products, market guides, and platform news"
          disabled={updatePrefs.isPending}
        />
        <Switch
          checked={emailPrefs?.promotions ?? false}
          onChange={() => handleToggle("promotions", "Promotions & vouchers emails")}
          label="Promotions & vouchers"
          description="Special discounts, flash sales, and personalized voucher codes"
          disabled={updatePrefs.isPending}
        />
        <Switch
          checked={emailPrefs?.vendor_updates ?? false}
          onChange={() => handleToggle("vendor_updates", "Vendor & platform notices")}
          label="Vendor & platform notices"
          description="Product policy changes, terms updates, and seller community notes"
          disabled={updatePrefs.isPending}
        />
      </div>
    </section>
  );
}

function AccountSecuritySection() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const deleteAccount = useDeleteAccount();

  const handleInitiateDelete = async () => {
    setCheckingEligibility(true);
    try {
      const eligibility = await accountSecurityService.checkDeletionEligibility();
      if (!eligibility.eligible) {
        toast.error(
          eligibility.reason ||
            "Your account cannot be deleted right now. Ensure you have no pending orders or remaining wallet balance.",
        );
        return;
      }
      setDeleteDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to verify account deletion eligibility");
    } finally {
      setCheckingEligibility(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Security & Credentials</h2>
        <p className="mt-1 text-sm text-muted">
          Manage your password and authentication settings.
        </p>
        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Password</p>
            <p className="text-xs text-muted">
              Reset or update your password via secure email verification.
            </p>
          </div>
          <ButtonLink href="/forgot-password" variant="outline" size="sm">
            <KeyRound className="size-4" /> Change password
          </ButtonLink>
        </div>
      </section>

      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-destructive">Delete account</h2>
            <p className="mt-1 text-sm text-muted">
              Permanently delete your ODOS account and all associated personal data. This action is irreversible. All orders, saved addresses, and payment methods will be cleared.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive hover:text-white"
                onClick={handleInitiateDelete}
                disabled={checkingEligibility || deleteAccount.isPending}
              >
                {checkingEligibility ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" /> Checking eligibility…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-1.5 size-4" /> Delete account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={deleteDialogOpen}
          title="Permanently delete your account?"
          description="Are you sure you want to delete your account? All your personal information, saved addresses, and payment preferences will be permanently wiped. This cannot be undone."
          confirmLabel={deleteAccount.isPending ? "Deleting account…" : "Yes, delete my account"}
          cancelLabel="Keep my account"
          pending={deleteAccount.isPending}
          onConfirm={() => deleteAccount.mutate()}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      </section>
    </div>
  );
}

function ProfileTabContent({ user }: { user: UserRead }) {
  return (
    <div className="space-y-6">
      <ProfileDetailsForm key={user.updated_at} user={user} />
      <EmailPreferencesSection />
      <AccountSecuritySection />
    </div>
  );
}

function isTabId(value: string | null): value is TabId {
  return TABS.some((t) => t.id === value);
}

function ProfileTabs() {
  const user = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const tab: TabId = isTabId(tabParam) ? tabParam : "profile";

  // Keeps the active tab in the URL, so a refresh (or a shared link) lands back on the same one.
  const setTab = (next: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "profile") params.delete("tab");
    else params.set("tab", next);
    router.replace(params.size > 0 ? `/account?${params.toString()}` : "/account", { scroll: false });
  };

  // Only ever mounts inside `RequireLogin`'s authenticated branch, so `user` is always set here.
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        {user.avatar_url ? (
          <Media src={user.avatar_url} name={user.full_name} className="size-16 shrink-0 rounded-full" sizes="64px" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-soft text-xl font-semibold text-accent">
            {initials(user.full_name)}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-semibold">{user.full_name}</p>
            {user.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <BadgeCheck className="size-3.5" aria-hidden /> Verified
              </span>
            )}
          </div>
          <p className="truncate text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-muted">Member since {formatDate(user.created_at)}</p>
        </div>
      </div>

      <div role="tablist" className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line">
        {TABS.filter((t) => {
          const isVendor = user.role === "vendor" || user.vendor_status === "approved";
          if (t.id === "vendor") return !isVendor;
          if (t.id === "dashboard" || t.id === "orders" || t.id === "products" || t.id === "customers") {
            return isVendor;
          }
          return true;
        }).map((t) => (
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
        {tab === "profile" && <ProfileTabContent user={user} />}
        {tab === "dashboard" && <SellerCenter />}
        {tab === "orders" && <VendorOrdersTab />}
        {tab === "products" && <VendorProductsTab />}
        {tab === "customers" && <VendorCustomersTab />}
        {tab === "payment" && <PaymentMethodsTab />}
        {tab === "wallet" && <WalletTab />}
        {tab === "address" && <AddressTab />}
        {tab === "returns" && <ReturnsTab />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "vouchers" && <VouchersTab />}
        {tab === "help" && <HelpSupportTab />}
        {tab === "vendor" && <VendorTab />}
        {tab === "chats" && <ChatsTab />}
        {tab === "loyalty" && <LoyaltyTab />}
      </div>
    </div>
  );
}

/** `initialTab` comes from the URL on the server, so the first-load skeleton matches the tab being opened. */
export function ProfileView({ initialTab }: { initialTab?: string }) {
  const skeleton = <ProfileSkeleton tab={initialTab} />;
  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Account</h1>
      <RequireLogin next="/account" message="Log in to view and update your account." fallback={skeleton}>
        <Suspense fallback={skeleton}>
          <ProfileTabs />
        </Suspense>
      </RequireLogin>
    </Container>
  );
}
