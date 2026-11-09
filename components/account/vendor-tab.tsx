"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, MapPin, Store } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useSession } from "@/hooks/use-auth";
import { useCategories, useMarkets } from "@/hooks/use-catalog";
import { useQueryParam } from "@/hooks/use-query-param";
import { GHANA_REGIONS } from "@/libs/checkout";
import { cn } from "@/libs/cn";
import { vendorService, type VendorApplicationCreate, type VendorApplicationRead } from "@/services/vendor.service";
import { canUploadPhotos, uploadPhoto } from "@/services/upload.service";
import { MOCK_MARKETS } from "@/mocks/catalog.mock";

const DEFAULT_CATEGORIES = [
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
        className="press block aspect-square w-full overflow-hidden rounded-xl bg-surface-muted bg-cover bg-center border border-line"
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

function VendorApplicationForm({
  initial,
  onClose,
  onSubmitted,
}: {
  initial?: VendorApplicationRead | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: categoriesData } = useCategories();
  const { data: marketsData } = useMarkets();

  const categories = useMemo(() => {
    if (categoriesData && categoriesData.length > 0) {
      return categoriesData.map((c) => c.name);
    }
    return DEFAULT_CATEGORIES;
  }, [categoriesData]);

  const markets = useMemo(() => {
    if (marketsData && marketsData.length > 0) {
      return marketsData;
    }
    return MOCK_MARKETS;
  }, [marketsData]);

  const [businessName, setBusinessName] = useState(initial?.business_name ?? "");
  const [businessCategory, setBusinessCategory] = useState<string | null>(initial?.business_category ?? null);
  const [businessDescription, setBusinessDescription] = useState(initial?.business_description ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initial?.phone_number ?? "");

  const [storeName, setStoreName] = useState(initial?.store_name ?? "");
  const [storeDescription, setStoreDescription] = useState(initial?.store_description ?? "");
  const [region, setRegion] = useState(initial?.region || "Greater Accra");
  const [city, setCity] = useState(initial?.city ?? "");

  const [locationInput, setLocationInput] = useState("");
  const [preferredMarket, setPreferredMarket] = useState<string | null>(initial?.preferred_market ?? null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
  const [shopPhotoPreview, setShopPhotoPreview] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handlePickLogo = (file: File) => {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handlePickBanner = (file: File) => {
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handlePickShop = (file: File) => {
    setShopPhotoFile(file);
    setShopPhotoPreview(URL.createObjectURL(file));
  };

  const submit = useMutation({
    mutationFn: async (payload: VendorApplicationCreate) => {
      return await vendorService.submitApplication(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", "application"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Vendor application submitted — we'll email you once it's reviewed.");
      onSubmitted();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    },
  });

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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsUploading(true);
    let logo_url: string | undefined = undefined;
    let banner_url: string | undefined = undefined;

    if (canUploadPhotos()) {
      try {
        if (logoFile) {
          logo_url = await uploadPhoto(logoFile, "odos/vendors/logos");
        }
        if (bannerFile) {
          banner_url = await uploadPhoto(bannerFile, "odos/vendors/banners");
        }
      } catch (err) {
        console.warn("Visuals upload warning:", err);
      }
    }

    try {
      await submit.mutateAsync({
        business_name: businessName.trim(),
        business_category: businessCategory,
        business_description: businessDescription.trim(),
        phone_number: phoneNumber.trim(),
        store_name: storeName.trim(),
        store_description: storeDescription.trim(),
        region,
        city: city.trim(),
        location_input: locationInput.trim(),
        preferred_market: preferredMarket,
        logo_url,
        banner_url,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const busy = submit.isPending || isUploading;

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            disabled={busy}
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
            {categories.map((category) => (
              <TogglePill
                key={category}
                selected={businessCategory === category}
                onClick={() => setBusinessCategory(category)}
              >
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
            placeholder="Tell us what you sell and how you source your items"
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            className={cn(inputClass, "h-auto resize-none py-3")}
          />
        </div>
        <Field
          id="phoneNumber"
          label="Business Phone Number *"
          type="tel"
          required
          placeholder="024 123 4567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <h3 className="text-sm font-semibold">Store information</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="storeName"
            label="Store Name *"
            placeholder="eg. Irma Fashions"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
          <div>
            <label htmlFor="store-region" className="mb-1.5 block text-sm font-medium">
              Region *
            </label>
            <select
              id="store-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={inputClass}
            >
              {GHANA_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Field
              id="storeCity"
              label="City / Town *"
              placeholder="eg. Osu, Accra"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="storeDescription" className="mb-1.5 block text-sm font-medium">
              Store Description *
            </label>
            <textarea
              id="storeDescription"
              rows={3}
              required
              placeholder="Short description customers will see on your store page"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              className={cn(inputClass, "h-auto resize-none py-3")}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-6 space-y-4">
        <h3 className="text-sm font-semibold">Location & Map</h3>
        <Field
          id="locationInput"
          label="GhanaPost GPS / Landmark *"
          placeholder="eg. GA-492-8291 or Oxford Street, opposite Total"
          required
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
        />
        <div className="grid aspect-video place-items-center rounded-xl bg-surface-muted">
          <div className="flex flex-col items-center gap-1.5 text-muted">
            <MapPin className="size-6" aria-hidden />
            <span className="text-xs">Location pinned on ODOS dispatch network</span>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <p className="mb-2 text-sm font-medium">Preferred Market *</p>
        <div className="flex flex-wrap gap-2">
          {markets.map((market) => {
            const label = ("name" in market && market.name) ? market.name : ("title" in market ? (market as { title: string }).title : market.slug);
            return (
              <TogglePill
                key={market.slug}
                selected={preferredMarket === label}
                onClick={() => setPreferredMarket(label)}
              >
                {label}
              </TogglePill>
            );
          })}
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <h3 className="text-sm font-semibold">Store visuals</h3>
        <p className="mt-0.5 text-xs text-muted">
          Upload a clean store logo and banner so your storefront feels trustworthy from day one.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <UploadSlot
            label="Store logo"
            buttonLabel="Upload logo"
            preview={logoPreview}
            onPick={handlePickLogo}
          />
          <UploadSlot
            label="Store Banner"
            buttonLabel="Upload Banner"
            preview={bannerPreview}
            onPick={handlePickBanner}
          />
          <UploadSlot
            label="Shop Photo"
            buttonLabel="Upload Shop Photo"
            preview={shopPhotoPreview}
            onPick={handlePickShop}
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="mt-8 w-full"
        disabled={!canSubmit || busy}
      >
        {busy ? "Submitting Application…" : "Submit Vendor Application"}
      </Button>
    </form>
  );
}

export function VendorSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading vendor status">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6 animate-pulse">
        <div className="size-12 shrink-0 rounded-2xl bg-surface-muted" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-5 w-36 rounded-md bg-surface-muted" />
          <div className="h-3.5 w-72 max-w-full rounded bg-surface-muted" />
        </div>
        <div className="h-9 w-24 shrink-0 rounded-full bg-surface-muted" />
      </div>
    </div>
  );
}

export function VendorTab() {
  const user = useSession()?.user;
  const [submitted, setSubmitted] = useState(false);

  // Read application status live from GET /vendor/applications/me
  const applicationQuery = useQuery({
    queryKey: ["vendor", "application"],
    queryFn: () => vendorService.myApplication(),
    enabled: Boolean(user),
  });

  const [applyParam, setApplyParam] = useQueryParam("apply");
  const applying = applyParam === "1";
  const setApplying = (next: boolean) => setApplyParam(next ? "1" : null);

  if (applicationQuery.isLoading) {
    return <VendorSkeleton />;
  }

  const apiApp = applicationQuery.data;
  const apiAppStatus = apiApp?.status;
  const baseStatus: ApplicationStatus =
    user?.vendor_status === "approved" || apiAppStatus === "approved"
      ? "approved"
      : user?.vendor_status === "pending" ||
        user?.vendor_status === "under_review" ||
        apiAppStatus === "pending" ||
        apiAppStatus === "under_review"
      ? "pending"
      : user?.vendor_status === "rejected" || apiAppStatus === "rejected"
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
          <p className="mt-0.5 text-sm text-muted">
            Apply once and manage your store from the same ODOS account after approval.
          </p>
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

      {status === "pending" && !applying && (
        <div className="rounded-2xl border border-warning/30 bg-surface p-5 sm:p-6 space-y-2">
          <div className="flex items-center gap-2 text-warning font-semibold text-sm">
            <Clock className="size-4.5" /> Application under review
          </div>
          <p className="text-sm text-muted leading-relaxed">
            We have received your vendor application for{" "}
            <strong className="text-foreground">
              {apiApp?.store_name || apiApp?.business_name || "your store"}
            </strong>
            . Our compliance team verifies marketplace stores within 24–48 hours. You will be able to access your Seller Center as soon as approval is granted.
          </p>
        </div>
      )}

      {status === "rejected" && !applying && (
        <div className="rounded-2xl border border-danger/30 bg-surface p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-danger font-semibold text-sm">
            <AlertTriangle className="size-4.5" /> Application not approved
          </div>
          <p className="text-sm text-muted leading-relaxed">
            {apiApp?.rejection_reason ||
              user?.vendor_rejection_reason ||
              "Your application could not be verified with the provided information. Please review and update your business and location details to re-apply."}
          </p>
          <Button variant="outline" size="sm" onClick={() => setApplying(true)}>
            Update details & re-apply
          </Button>
        </div>
      )}

      {status === "approved" && (
        <div className="rounded-2xl border border-success/30 bg-surface p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-success font-semibold text-sm">
            <CheckCircle2 className="size-4.5" /> You're a verified ODOS Vendor!
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Your storefront is active. You can start listing products, managing inventory, receiving orders, and viewing payouts in the Seller Center.
          </p>
          <ButtonLink href="/account?tab=dashboard" variant="accent" size="sm">
            Open Seller Center
          </ButtonLink>
        </div>
      )}

      {applying && (
        <VendorApplicationForm
          initial={apiApp}
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
