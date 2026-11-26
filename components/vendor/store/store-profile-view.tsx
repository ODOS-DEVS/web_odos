"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ExternalLink, ImagePlus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { QueryError } from "@/components/ui/query-error";
import { RegionCitySelect } from "@/components/ui/region-city-select";
import { StoreLocationFields } from "@/components/vendor/store/store-location-fields";
import { PageHeader, Panel, PanelHeader } from "@/components/vendor/vendor-ui";
import { cn } from "@/libs/cn";
import { useCategories } from "@/hooks/use-catalog";
import { useSaveVendorStoreProfile, useVendorStoreProfile } from "@/hooks/use-vendor-store";
import { WEEKDAYS, type BusinessHours } from "@/types/vendor";

const DEFAULT_HOURS: BusinessHours = Object.fromEntries(
  WEEKDAYS.map((day) => [day, { open: "09:00", close: "17:00", closed: day === "sunday" }]),
);

function Labelled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function ImageField({
  label,
  currentUrl,
  file,
  onPick,
  aspect,
}: {
  label: string;
  currentUrl: string | null;
  file: File | null;
  onPick: (file: File | null) => void;
  aspect: string;
}) {
  const preview = file ? URL.createObjectURL(file) : currentUrl;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <label className={cn("press block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-line hover:border-foreground", aspect)}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- Remote store imagery and local previews.
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center gap-1 text-sm text-muted">
            <ImagePlus className="size-5" aria-hidden />
          </span>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
      </label>
      {file && (
        <button type="button" onClick={() => onPick(null)} className="press mt-1 text-xs text-muted hover:text-foreground">
          Undo
        </button>
      )}
    </div>
  );
}

export function StoreProfileView() {
  const query = useVendorStoreProfile();
  const save = useSaveVendorStoreProfile();
  const { data: categories } = useCategories();

  const [form, setForm] = useState<Record<string, string>>({});
  const [vacation, setVacation] = useState<boolean | null>(null);
  const [hours, setHours] = useState<BusinessHours | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  /**
   * Latitude, longitude and market are not strings, so they do not fit the
   * generic `form` record above. Null means "not touched yet" and falls back
   * to the stored value, matching how `value()` behaves for the text fields.
   */
  const [place, setPlace] = useState<{
    latitude?: number | null;
    longitude?: number | null;
    marketId?: string | null;
  }>({});
  const [error, setError] = useState<string | null>(null);

  if (query.isError) {
    return <QueryError title="We couldn't load your store" error={query.error} onRetry={() => query.refetch()} />;
  }
  if (query.isPending || !query.data) {
    return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  }

  const store = query.data;
  // Uncontrolled-until-touched: the stored value shows until the vendor edits that field.
  const value = (key: string, fallback: string | null) => form[key] ?? fallback ?? "";
  const set = (key: string, next: string) => setForm((f) => ({ ...f, [key]: next }));
  const onVacation = vacation ?? store.isOnVacation;
  const currentHours = hours ?? store.businessHours ?? DEFAULT_HOURS;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const name = value("name", store.name).trim();
    const description = value("description", store.description).trim();
    if (name.length < 2) return setError("Your store name needs at least 2 characters.");
    if (description.length < 12) return setError("The description needs at least 12 characters.");
    // The application form accepts up to 1000 characters but this endpoint caps at 255, so a
    // description written at sign-up can be too long to save here. Say so instead of 422-ing.
    if (description.length > 255) {
      return setError(
        `Your description is ${description.length} characters — shorten it to 255 or fewer to save.`,
      );
    }

    save.mutate(
      {
        name,
        description,
        category: value("category", store.category),
        region: value("region", store.region),
        city: value("city", store.city),
        marketId: place.marketId !== undefined ? place.marketId : store.marketId,
        latitude: place.latitude !== undefined ? place.latitude : store.latitude,
        longitude: place.longitude !== undefined ? place.longitude : store.longitude,
        audienceSlugs: store.audienceSlugs,
        location: value("location", store.location) || null,
        phone: value("phone", store.phone) || null,
        instagramUrl: value("instagramUrl", store.instagramUrl) || null,
        facebookUrl: value("facebookUrl", store.facebookUrl) || null,
        tiktokUrl: value("tiktokUrl", store.tiktokUrl) || null,
        twitterUrl: value("twitterUrl", store.twitterUrl) || null,
        whatsappUrl: value("whatsappUrl", store.whatsappUrl) || null,
        websiteUrl: value("websiteUrl", store.websiteUrl) || null,
        isOnVacation: onVacation,
        vacationMessage: value("vacationMessage", store.vacationMessage) || null,
        businessHours: currentHours,
        logo,
        banner,
      },
      {
        onSuccess: () => {
          toast.success("Store profile saved");
          setLogo(null);
          setBanner(null);
        },
        onError: (e) => setError(e instanceof Error ? e.message : "We couldn't save your store."),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <PageHeader
        title="Store profile"
        description="What shoppers see on your storefront. Changes go live immediately."
        actions={
          <a
            href={`/stores/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-foreground"
          >
            <ExternalLink className="size-4" aria-hidden />
            View storefront
          </a>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel>
            <PanelHeader title="Business details" />
            <div className="space-y-4 p-5">
              <Labelled label="Store name">
                <input className={inputClass} value={value("name", store.name)} onChange={(e) => set("name", e.target.value)} maxLength={160} required />
              </Labelled>
              <Labelled
                label="Description"
                hint={`${value("description", store.description).length} / 255 characters.`}
              >
                <textarea
                  className={cn(inputClass, "h-24 resize-y py-3")}
                  value={value("description", store.description)}
                  onChange={(e) => set("description", e.target.value)}
                  required
                />
              </Labelled>
              <div className="grid gap-4 sm:grid-cols-2">
                <Labelled label="Business category">
                  <select className={inputClass} value={value("category", store.category)} onChange={(e) => set("category", e.target.value)} required>
                    {!categories?.some((c) => c.name === value("category", store.category)) && (
                      <option value={value("category", store.category)}>{value("category", store.category)}</option>
                    )}
                    {categories?.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Labelled>
                <Labelled label="Phone">
                  <input className={inputClass} value={value("phone", store.phone)} onChange={(e) => set("phone", e.target.value)} maxLength={30} />
                </Labelled>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Where you are" />
            <div className="space-y-4 p-5">
              <RegionCitySelect
                region={value("region", store.region)}
                city={value("city", store.city)}
                onRegionChange={(next) => {
                  set("region", next);
                  set("city", "");
                }}
                onCityChange={(next) => set("city", next)}
              />
              <StoreLocationFields
                address={value("location", store.location)}
                latitude={place.latitude !== undefined ? place.latitude : store.latitude}
                longitude={place.longitude !== undefined ? place.longitude : store.longitude}
                marketId={place.marketId !== undefined ? place.marketId : store.marketId}
                onChange={({ address: nextAddress, ...rest }) => {
                  // The address is a plain string and lives in `form`; the rest
                  // are not, so they live in `place`.
                  if (nextAddress !== undefined) set("location", nextAddress);
                  if (Object.keys(rest).length) setPlace((current) => ({ ...current, ...rest }));
                }}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Opening hours" />
            <ul className="divide-y divide-line">
              {WEEKDAYS.map((day) => {
                const entry = currentHours[day] ?? { open: "09:00", close: "17:00", closed: false };
                return (
                  <li key={day} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="w-24 shrink-0 text-sm font-medium capitalize">{day}</span>
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={!entry.closed}
                        onChange={(e) => setHours({ ...currentHours, [day]: { ...entry, closed: !e.target.checked } })}
                        className="size-4 accent-[var(--accent)]"
                      />
                      Open
                    </label>
                    <input
                      type="time"
                      value={entry.open}
                      disabled={entry.closed}
                      onChange={(e) => setHours({ ...currentHours, [day]: { ...entry, open: e.target.value } })}
                      className={cn(inputClass, "h-9 w-28 disabled:opacity-40")}
                    />
                    <span className="text-xs text-muted">to</span>
                    <input
                      type="time"
                      value={entry.close}
                      disabled={entry.closed}
                      onChange={(e) => setHours({ ...currentHours, [day]: { ...entry, close: e.target.value } })}
                      className={cn(inputClass, "h-9 w-28 disabled:opacity-40")}
                    />
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Links" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {([
                ["whatsappUrl", "WhatsApp", store.whatsappUrl],
                ["instagramUrl", "Instagram", store.instagramUrl],
                ["facebookUrl", "Facebook", store.facebookUrl],
                ["tiktokUrl", "TikTok", store.tiktokUrl],
                ["twitterUrl", "X / Twitter", store.twitterUrl],
                ["websiteUrl", "Website", store.websiteUrl],
              ] as const).map(([key, label, current]) => (
                <Labelled key={key} label={label}>
                  <input className={inputClass} type="url" value={value(key, current)} onChange={(e) => set(key, e.target.value)} maxLength={255} placeholder="https://" />
                </Labelled>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Branding" />
            <div className="space-y-4 p-5">
              <ImageField label="Logo" currentUrl={store.logoUrl} file={logo} onPick={setLogo} aspect="aspect-square w-28" />
              <ImageField label="Cover banner" currentUrl={store.bannerUrl} file={banner} onPick={setBanner} aspect="aspect-[3/1] w-full" />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Availability" />
            <div className="space-y-3 p-5">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={onVacation}
                  onChange={(e) => setVacation(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--accent)]"
                />
                <span>
                  <span className="font-medium">Vacation mode</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Your storefront stays visible but stops taking new orders.
                  </span>
                </span>
              </label>
              {onVacation && (
                <Labelled label="Message to shoppers">
                  <textarea
                    className={cn(inputClass, "h-20 resize-y py-3")}
                    value={value("vacationMessage", store.vacationMessage)}
                    onChange={(e) => set("vacationMessage", e.target.value)}
                    maxLength={500}
                    placeholder="Back on the 14th — thanks for your patience!"
                  />
                </Labelled>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Status" />
            <div className="flex items-center gap-2 px-5 py-4 text-sm">
              <Store className="size-4 text-muted" aria-hidden />
              <span className="capitalize">{store.status.replace(/_/g, " ")}</span>
            </div>
          </Panel>

          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save store profile"}
          </Button>
        </div>
      </div>
    </form>
  );
}
