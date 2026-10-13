"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, MapPin, Store } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useSession } from "@/hooks/use-auth";
import { useQueryParam } from "@/hooks/use-query-param";
import { GHANA_REGIONS } from "@/libs/checkout";
import { cn } from "@/libs/cn";
import { useFakeMutation } from "@/mocks/mutation";
import { MOCK_MARKETS } from "@/mocks/catalog.mock";

const BUSINESS_CATEGORIES = [
  "Fashion & Accessories",
  "Beauty & Personal Care",
  "Electronics",
  "Home & Living",
  "Food & Grocery",
  "Sports & Fitness",
  "Kids & Family",
  "General Merchandising",
] as const;

type ApplicationStatus = "none" | "pending" | "approved" | "rejected";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  none: "Not Applied",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  none: "accent",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

function mockSubmitVendorApplication(input: Record<string, unknown>) {
  return input;
}

function UploadSlot({
  label,
  buttonLabel,
  preview,
  onPick,
}: {
  label: string;
  buttonLabel: string;
  preview: string | null;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onPick(file);
    event.target.value = "";
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="press block aspect-square w-full overflow-hidden rounded-xl bg-surface-muted bg-cover bg-center"
        style={preview ? { backgroundImage: `url(${preview})` } : undefined}
        aria-label={buttonLabel}
      />
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="sr-only" />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="mt-2 w-full">
        {buttonLabel}
      </Button>
    </div>
  );
}

function VendorApplicationForm({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const submit = useFakeMutation(mockSubmitVendorApplication);

  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState<(typeof BUSINESS_CATEGORIES)[number] | null>(null);
  const [businessDescription, setBusinessDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [region, setRegion] = useState("Greater Accra");
  const [city, setCity] = useState("");

  const [locationInput, setLocationInput] = useState("");
  const [preferredMarket, setPreferredMarket] = useState<string | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [shopPhotoPreview, setShopPhotoPreview] = useState<string | null>(null);

  const readAsDataUrl = (file: File, onLoaded: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => onLoaded(reader.result as string);
    reader.readAsDataURL(file);
  };

  const canSubmit =
    businessName.trim() &&
    businessCategory &&
    businessDescription.trim() &&
    phoneNumber.trim() &&
    storeName.trim() &&
    storeDescription.trim() &&
    city.trim() &&
    locationInput.trim() &&
    preferredMarket;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    submit.mutate(
      {
        businessName,
        businessCategory,
        businessDescription,
        phoneNumber,
        storeName,
        storeDescription,
        region,
        city,
        locationInput,
        preferredMarket,
      },
      {
        onSuccess: () => {
          toast.success("Vendor application submitted — we'll email you once it's reviewed.");
          onSubmitted();
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="press mt-0.5 grid size-7 shrink-0 place-items-center rounded-full hover:bg-surface-muted"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Become a Vendor</h2>
            <p className="mt-1 text-sm text-muted">
              Submit your business and store details once. Customers keep the same account, and approved vendors unlock
              store management in the same app.
            </p>
          </div>
        </div>
        <Badge tone="accent" className="shrink-0">
          Not Applied
        </Badge>
      </div>

      <div className="mt-6 space-y-5">
        <h3 className="text-sm font-semibold">Business information</h3>
        <Field
          id="businessName"
          label="Business Name *"
          placeholder="eg. Irma Fashion House"
          required
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium">Business Category *</p>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_CATEGORIES.map((category) => (
              <TogglePill key={category} selected={businessCategory === category} onClick={() => setBusinessCategory(category)}>
                {category}
              </TogglePill>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="businessDescription" className="mb-1.5 block text-sm font-medium">
            Business Description *
          </label>
          <textarea
            id="businessDescription"
            rows={3}
            required
            placeholder="Tell ODOS what you sell and how your business operates."
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            className={cn(inputClass, "h-auto min-h-24 resize-none py-3")}
          />
        </div>
        <Field
          id="businessPhone"
          label="Phone Number *"
          type="tel"
          placeholder="eg. 0241234568"
          required
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <div className="mt-8 space-y-5 border-t border-line pt-6">
        <h3 className="text-sm font-semibold">Store setup</h3>
        <Field
          id="storeName"
          label="Store Name *"
          placeholder="eg. The name customers will see"
          required
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />
        <div>
          <label htmlFor="storeDescription" className="mb-1.5 block text-sm font-medium">
            Store Description *
          </label>
          <textarea
            id="storeDescription"
            rows={3}
            required
            placeholder="eg. Optional short summary"
            value={storeDescription}
            onChange={(e) => setStoreDescription(e.target.value)}
            className={cn(inputClass, "h-auto min-h-24 resize-none py-3")}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="region" className="mb-1.5 block text-sm font-medium">
              Region *
            </label>
            <select id="region" name="region" required value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
              {GHANA_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <Field id="city" label="City *" placeholder="eg. Accra" required value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>

      <div className="mt-8 space-y-4 border-t border-line pt-6">
        <div>
          <h3 className="text-sm font-semibold">Where is your store</h3>
          <p className="mt-0.5 text-xs text-muted">
            Pinpoint your GhanaPost GPS (eg. GA-143-2301), describe the landmark, or use the buttons below — you never need
            to enter map pins, ODOS handles that for you.
          </p>
        </div>
        <Field
          id="location"
          label="GhanaPost GPS or Landmark *"
          placeholder="eg. GA-143-2301 or Accra Mall (King Road)"
          required
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
        />
        <Button type="button" variant="accent" size="lg" className="w-full" onClick={() => toast("Finding your location on the map…")}>
          Find on map
        </Button>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => toast("Using your current location…")}>
          I&apos;m at my store
        </Button>
        <div className="grid aspect-video place-items-center rounded-xl bg-surface-muted">
          <div className="flex flex-col items-center gap-1.5 text-muted">
            <MapPin className="size-6" aria-hidden />
            <span className="text-xs">Map preview</span>
          </div>
        </div>
        <p className="text-center text-xs text-muted">
          Tip: if &quot;Find on map&quot; marks your GPS code, stand at your shop and tap &quot;I&apos;m at my store&quot;.
        </p>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <p className="mb-2 text-sm font-medium">Preferred Market *</p>
        <div className="flex flex-wrap gap-2">
          {MOCK_MARKETS.map((market) => (
            <TogglePill key={market.slug} selected={preferredMarket === market.title} onClick={() => setPreferredMarket(market.title)}>
              {market.title}
            </TogglePill>
          ))}
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <h3 className="text-sm font-semibold">Store visuals</h3>
        <p className="mt-0.5 text-xs text-muted">Upload a clean store logo and banner so your storefront feels trustworthy from day one.</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <UploadSlot label="Store logo" buttonLabel="Upload logo" preview={logoPreview} onPick={(f) => readAsDataUrl(f, setLogoPreview)} />
          <UploadSlot label="Store Banner" buttonLabel="Upload Banner" preview={bannerPreview} onPick={(f) => readAsDataUrl(f, setBannerPreview)} />
          <UploadSlot
            label="Store Phone"
            buttonLabel="Upload Shop Photo"
            preview={shopPhotoPreview}
            onPick={(f) => readAsDataUrl(f, setShopPhotoPreview)}
          />
        </div>
      </div>

      <Button type="submit" variant="accent" size="lg" className="mt-8 w-full" disabled={!canSubmit || submit.isPending}>
        {submit.isPending ? "Submitting…" : "Submit Vendor Application"}
      </Button>
    </form>
  );
}

export function VendorTab() {
  const user = useSession()?.user;
  const [submitted, setSubmitted] = useState(false);

  // Kept in the URL (like the outer account tab) so a refresh or shared link doesn't drop the open form.
  const [applyParam, setApplyParam] = useQueryParam("apply");
  const applying = applyParam === "1";
  const setApplying = (next: boolean) => setApplyParam(next ? "1" : null);

  const baseStatus: ApplicationStatus = user?.vendor_status === "pending" || user?.vendor_status === "under_review"
    ? "pending"
    : user?.vendor_status === "approved"
      ? "approved"
      : user?.vendor_status === "rejected"
        ? "rejected"
        : "none";
  const status: ApplicationStatus = submitted ? "pending" : baseStatus;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-accent/40 bg-accent-soft text-accent">
          <Store className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Become a Vendor</p>
          <p className="mt-0.5 text-sm text-muted">Apply once and manage your store from the same ODOS account after approval.</p>
        </div>
        {status === "none" && (
          <button
            type="button"
            onClick={() => setApplying(true)}
            className="press flex shrink-0 items-center gap-1 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-foreground"
          >
            Apply
            <ChevronRight className="size-4" aria-hidden />
          </button>
        )}
        {status === "approved" && (
          <Link
            href="/account?tab=dashboard"
            className="press flex shrink-0 items-center gap-1 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-foreground"
          >
            Seller Center
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
        {status === "pending" || status === "rejected" ? (
          <Badge tone={STATUS_TONE[status]} className="shrink-0">
            {STATUS_LABEL[status]}
          </Badge>
        ) : null}
      </div>

      {applying && (
        <VendorApplicationForm
          onClose={() => setApplying(false)}
          onSubmitted={() => {
            setSubmitted(true);
            setApplying(false);
          }}
        />
      )}
    </div>
  );
}
