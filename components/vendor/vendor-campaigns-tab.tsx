"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { CalendarRange, ImagePlus, Megaphone, Pencil, Plus, Store, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { useSaveVendorCampaign, useVendorCampaigns } from "@/hooks/use-vendor-campaigns";
import { useVendorProducts } from "@/hooks/use-vendor-products";
import { cn } from "@/libs/cn";
import { formatDate } from "@/libs/format";
import { ApiError } from "@/services/http";
import { canUploadPhotos, MAX_PHOTO_BYTES, uploadPhoto } from "@/services/upload.service";
import type { VendorCampaign, VendorCampaignInput } from "@/services/vendor-campaigns.service";

const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  approved: "success",
  live: "success",
  scheduled: "accent",
  pending: "warning",
  pending_review: "warning",
  submitted: "warning",
  draft: "neutral",
  ended: "neutral",
  expired: "neutral",
  rejected: "danger",
  cancelled: "danger",
};

const statusLabel = (status: string) => status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Campaigns that are over (or turned down) can't be changed. */
const isLocked = (status: string) => ["ended", "expired", "cancelled"].includes(status);

const dayOf = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
/** "YYYY-MM-DD" → ISO at the start (or end) of that local day. */
const toIso = (day: string, endOfDay = false) => (day ? new Date(`${day}T${endOfDay ? "23:59:59" : "00:00:00"}`).toISOString() : null);

export function VendorCampaignsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading campaigns">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex animate-pulse gap-3 rounded-2xl border border-line bg-surface p-3">
          <div className="h-20 w-32 shrink-0 rounded-xl bg-surface-muted" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-40 rounded bg-surface-muted" />
            <div className="h-3 w-56 rounded bg-surface-muted" />
            <div className="h-3 w-28 rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignCard({ campaign, onEdit }: { campaign: VendorCampaign; onEdit: () => void }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 sm:flex-row">
      <Media src={campaign.bannerUrl} name={campaign.title} className="aspect-[16/9] w-full shrink-0 rounded-xl sm:aspect-auto sm:h-24 sm:w-40" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{campaign.title}</p>
            {campaign.subtitle && <p className="truncate text-sm text-muted">{campaign.subtitle}</p>}
          </div>
          <Badge tone={STATUS_TONE[campaign.status] ?? "neutral"}>{statusLabel(campaign.status)}</Badge>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <CalendarRange className="size-3.5" aria-hidden />
            {campaign.startsAt ? formatDate(campaign.startsAt) : "No start date"} – {campaign.endsAt ? formatDate(campaign.endsAt) : "No end date"}
          </span>
          <span>
            {campaign.productIds.length} {campaign.productIds.length === 1 ? "product" : "products"}
          </span>
        </p>
      </div>
      {!isLocked(campaign.status) && (
        <Button size="sm" variant="outline" onClick={onEdit} className="self-start">
          <Pencil className="mr-1.5 size-3.5" aria-hidden /> Edit
        </Button>
      )}
    </li>
  );
}

function BannerInput({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const canUpload = canUploadPhotos();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) return toast.error("Banner must be under 5 MB");
    setUploading(true);
    try {
      onChange(await uploadPhoto(file, "odos/campaigns"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Banner</p>
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-line">
          <Media src={value} name="Campaign banner" className="aspect-[16/7] w-full" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove banner"
            className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-background/90 shadow"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : canUpload ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-sm text-muted hover:border-foreground/40"
        >
          <ImagePlus className="size-6" aria-hidden />
          {uploading ? "Uploading…" : "Upload a banner (16:7 works best)"}
        </button>
      ) : (
        <Field id="campaign-banner" label="" placeholder="https://…/banner.jpg" type="url" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}

function ProductPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const { data: products = [], isPending } = useVendorProducts();
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, query]);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <p className="text-sm font-medium">Products</p>
        <span className="text-xs text-muted">{selected.length} selected</span>
      </div>
      {products.length > 6 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your products"
          aria-label="Search products"
          className="mb-2 h-10 w-full rounded-full border border-line bg-surface px-4 text-sm focus:border-foreground focus:outline-none"
        />
      )}
      {isPending ? (
        <div className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">Add products first, then feature them here.</p>
      ) : (
        <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-2xl border border-line">
          {shown.map((p) => {
            const checked = selected.includes(p.id);
            return (
              <li key={p.id}>
                <label className={cn("flex cursor-pointer items-center gap-3 p-2.5 text-sm", checked && "bg-accent-soft/40")}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} className="size-4 accent-[var(--color-accent)]" />
                  <Media src={p.imageUrl} name={p.name} className="size-9 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CampaignForm({ campaign, onDone }: { campaign: VendorCampaign | null; onDone: () => void }) {
  const save = useSaveVendorCampaign();
  const [title, setTitle] = useState(campaign?.title ?? "");
  const [subtitle, setSubtitle] = useState(campaign?.subtitle ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [banner, setBanner] = useState(campaign?.bannerUrl ?? "");
  const [startsOn, setStartsOn] = useState(dayOf(campaign?.startsAt ?? null));
  const [endsOn, setEndsOn] = useState(dayOf(campaign?.endsAt ?? null));
  const [productIds, setProductIds] = useState<string[]>(campaign?.productIds ?? []);
  const farFuture = useMemo(() => new Date(new Date().getFullYear() + 3, 11, 31), []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return toast.error("Give the campaign a title");
    if (startsOn && endsOn && endsOn < startsOn) return toast.error("The end date must be after the start date");

    const input: VendorCampaignInput = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      banner_image_url: banner.trim() || null,
      starts_at: toIso(startsOn),
      ends_at: toIso(endsOn, true),
      product_ids: productIds,
    };
    save.mutate(
      { id: campaign?.id, input },
      {
        onSuccess: () => {
          toast.success(campaign ? "Campaign updated" : "Campaign created");
          onDone();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto p-5">
      <Field id="campaign-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekend mega sale" required />
      <Field id="campaign-subtitle" label="Subtitle" hint="Optional" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Up to 30% off" />
      <div>
        <label htmlFor="campaign-description" className="mb-1.5 block text-sm font-medium">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="campaign-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-2xl border border-line bg-surface p-3 text-sm focus:border-foreground focus:outline-none"
        />
      </div>
      <BannerInput value={banner} onChange={setBanner} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DatePickerField id="campaign-start" label="Starts" value={startsOn} onChange={setStartsOn} fromYear={new Date().getFullYear()} toDate={farFuture} />
        <DatePickerField id="campaign-end" label="Ends" value={endsOn} onChange={setEndsOn} fromYear={new Date().getFullYear()} toDate={farFuture} />
      </div>
      <ProductPicker selected={productIds} onChange={setProductIds} />
      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="accent" disabled={save.isPending}>
          {save.isPending ? "Saving…" : campaign ? "Save changes" : "Create campaign"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Vendor → Campaigns: GET/POST /vendor/campaigns, GET/PUT /vendor/campaigns/{id}. */
export function VendorCampaignsTab() {
  const campaigns = useVendorCampaigns();
  const [editing, setEditing] = useState<VendorCampaign | "new" | null>(null);
  const notVendor = campaigns.error instanceof ApiError && campaigns.error.status === 403;
  const rows = campaigns.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Promote a set of your products with a banner and dates.</p>
        {!notVendor && (
          <Button size="sm" variant="accent" onClick={() => setEditing("new")}>
            <Plus className="mr-1 size-4" aria-hidden /> New campaign
          </Button>
        )}
      </div>

      {campaigns.isPending ? (
        <VendorCampaignsSkeleton />
      ) : campaigns.isError ? (
        notVendor ? (
          <EmptyState
            icon={<Store className="size-10 text-muted" aria-hidden />}
            title="This account isn’t a vendor yet"
            description="Once your store is approved you can run campaigns here."
          />
        ) : (
          <QueryError error={campaigns.error} onRetry={() => campaigns.refetch()} title="We couldn’t load your campaigns" />
        )
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-10 text-muted" aria-hidden />}
          title="No campaigns yet"
          description="Create one to feature your products with a banner on ODOS."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <CampaignCard key={c.id} campaign={c} onEdit={() => setEditing(c)} />
          ))}
        </ul>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New campaign" : "Edit campaign"}
        labelId="vendor-campaign-form-heading"
      >
        {editing && (
          <CampaignForm key={editing === "new" ? "new" : editing.id} campaign={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        )}
      </Drawer>
    </div>
  );
}
