"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Pencil, Plus, Wrench, X } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
import { PageHeader, Panel, PanelHeader, SkeletonRows } from "@/components/vendor/vendor-ui";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import {
  useCreateService,
  useMyServices,
  useServiceCategories,
  useSetServiceStatus,
  useUpdateService,
} from "@/hooks/use-services";
import type { ServiceSummary } from "@/types/services";

const STATUS_TONE: Record<string, BadgeTone> = {
  published: "success",
  active: "success",
  draft: "neutral",
  pending: "warning",
  suspended: "danger",
};

/** Only the two the API accepts for pricing a service listing. */
const PRICING_MODELS = [
  { value: "fixed", label: "Fixed price" },
  { value: "hourly", label: "Hourly rate" },
  { value: "quote", label: "Quote on request" },
];

const BOOKING_TYPES = [
  { value: "request", label: "Customer requests, I accept" },
  { value: "instant", label: "Customers book a slot instantly" },
];

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const digitsOnly = (value: string) => value.replace(/[^0-9.]/g, "");

function ServiceForm({ service, onDone }: { service?: ServiceSummary; onDone: () => void }) {
  const categories = useServiceCategories();
  const create = useCreateService();
  const update = useUpdateService();
  const editing = Boolean(service);

  const [form, setForm] = useState({
    title: service?.title ?? "",
    summary: service?.summary ?? "",
    description: "",
    categoryId: service?.categoryId ?? "",
    pricingModel: service?.pricingModel ?? "fixed",
    bookingType: service?.bookingType ?? "request",
    basePrice: service ? String(service.basePrice) : "",
    durationMinutes: service?.durationMinutes ? String(service.durationMinutes) : "",
    serviceAreas: "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const pending = create.isPending || update.isPending;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (form.title.trim().length < 3) return setError("Give the service a name of at least 3 characters.");
    // A quote-based listing has no fixed price to validate; everything else needs one.
    if (form.pricingModel !== "quote" && !form.basePrice) return setError("Set a price, or switch to quote on request.");

    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      description: form.description.trim() || null,
      categoryId: form.categoryId || null,
      pricingModel: form.pricingModel,
      bookingType: form.bookingType,
      basePrice: Number(form.basePrice || 0),
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      serviceAreas: splitList(form.serviceAreas),
    };

    const onSuccess = () => {
      toast.success(editing ? "Service updated" : "Service created");
      onDone();
    };
    const onError = (e: unknown) => setError(e instanceof Error ? e.message : "We couldn't save that service.");

    if (service) update.mutate({ id: service.id, ...payload }, { onSuccess, onError });
    else create.mutate(payload, { onSuccess, onError });
  };

  return (
    <Panel>
      <PanelHeader
        title={editing ? `Edit ${service?.title}` : "New service"}
        action={
          <Button type="button" variant="ghost" size="sm" onClick={onDone} aria-label="Close">
            <X className="size-4" aria-hidden />
          </Button>
        }
      />
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Service name</span>
          <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={255} required />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Short summary</span>
          <input className={inputClass} value={form.summary} onChange={(e) => set("summary", e.target.value)} maxLength={300} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Full description</span>
          <textarea
            className={cn(inputClass, "h-28 resize-y py-3")}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Category</span>
            <select className={inputClass} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Choose a category</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `  ${c.title}` : c.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">How it&apos;s priced</span>
            <select className={inputClass} value={form.pricingModel} onChange={(e) => set("pricingModel", e.target.value)}>
              {PRICING_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              {form.pricingModel === "hourly" ? "Hourly rate (GH₵)" : "Price (GH₵)"}
            </span>
            <input
              className={inputClass}
              inputMode="decimal"
              value={form.basePrice}
              onChange={(e) => set("basePrice", digitsOnly(e.target.value))}
              disabled={form.pricingModel === "quote"}
              placeholder={form.pricingModel === "quote" ? "Quoted per job" : ""}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Typical duration (minutes)</span>
            <input
              className={inputClass}
              inputMode="numeric"
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", e.target.value.replace(/[^0-9]/g, ""))}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">How customers book</span>
          <select className={inputClass} value={form.bookingType} onChange={(e) => set("bookingType", e.target.value)}>
            {BOOKING_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Areas you cover</span>
          <input
            className={inputClass}
            value={form.serviceAreas}
            onChange={(e) => set("serviceAreas", e.target.value)}
            placeholder="Accra, Tema, Legon"
          />
          <span className="mt-1 block text-xs text-muted">Comma separated.</span>
        </label>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Create service"}
          </Button>
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/** Provider-side listing management. */
export function VendorServicesView() {
  const query = useMyServices();
  const setStatus = useSetServiceStatus();
  const [editing, setEditing] = useState<ServiceSummary | null>(null);
  const [creating, setCreating] = useState(false);

  // The services API is not deployed everywhere yet; say so rather than showing a broken page.
  if (query.isError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Services" description="List the work you do and take bookings through ODOS." />
        <EmptyState
          icon={<Wrench className="size-10 text-muted" aria-hidden />}
          iconBadge
          title="Services aren't enabled yet"
          description="The ODOS services marketplace isn't live on this environment. Your products are unaffected."
        />
      </div>
    );
  }

  const rows = query.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Services"
        description={`${rows.length} service${rows.length === 1 ? "" : "s"} listed.`}
        actions={
          !creating && !editing ? (
            <Button type="button" onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden />
              Add service
            </Button>
          ) : undefined
        }
      />

      {creating && <ServiceForm onDone={() => setCreating(false)} />}
      {editing && <ServiceForm service={editing} onDone={() => setEditing(null)} />}

      {query.isPending ? (
        <SkeletonRows count={3} />
      ) : rows.length === 0 && !creating ? (
        <EmptyState
          icon={<Wrench className="size-10 text-muted" aria-hidden />}
          title="No services listed yet"
          description="Add your first service and customers can find and book it on ODOS."
          action={<Button type="button" onClick={() => setCreating(true)}>Add your first service</Button>}
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-line">
            {rows.map((service) => (
              <li key={service.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <Media src={service.imageUrl} name={service.title} sizes="48px" className="size-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{service.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {service.pricingModel === "quote"
                      ? "Quoted per job"
                      : service.pricingModel === "hourly"
                        ? `${formatMoney(service.basePrice)}/hr`
                        : formatMoney(service.basePrice)}
                    {service.durationMinutes ? ` · ${service.durationMinutes} min` : ""}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[service.bookingType] ?? "neutral"}>
                  {service.bookingType === "instant" ? "Instant booking" : "By request"}
                </Badge>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(service)}>
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={setStatus.isPending}
                  onClick={() =>
                    setStatus.mutate(
                      { id: service.id, status: "draft" },
                      {
                        onSuccess: () => toast.success("Service hidden"),
                        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't change that."),
                      },
                    )
                  }
                >
                  <EyeOff className="size-3.5" aria-hidden />
                  <span className="sr-only">Unpublish {service.title}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={setStatus.isPending}
                  onClick={() =>
                    setStatus.mutate(
                      { id: service.id, status: "published" },
                      {
                        onSuccess: () => toast.success("Service published"),
                        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't change that."),
                      },
                    )
                  }
                >
                  <Eye className="size-3.5" aria-hidden />
                  <span className="sr-only">Publish {service.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
