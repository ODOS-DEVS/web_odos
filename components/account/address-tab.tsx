"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Building2,
  Check,
  CheckCircle2,
  Home,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, inputClass } from "@/components/ui/field";
import { GHANA_REGIONS } from "@/libs/checkout";
import { cn } from "@/libs/cn";
import { useAddresses, type SavedAddress } from "@/hooks/use-addresses";
import { useQueryParam } from "@/hooks/use-query-param";

type Draft = Omit<SavedAddress, "id">;

const PRESET_LABELS = ["Home", "Office", "Apartment", "Other"] as const;

const EMPTY_DRAFT: Draft = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  city: "",
  region: "Greater Accra",
  isDefault: false,
};

function getAddressIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("home") || l.includes("house")) {
    return <Home className="size-4.5" aria-hidden />;
  }
  if (l.includes("office") || l.includes("work") || l.includes("biz") || l.includes("comp")) {
    return <Building2 className="size-4.5" aria-hidden />;
  }
  return <MapPin className="size-4.5" aria-hidden />;
}

function AddressForm({
  initial,
  onCancel,
  onDone,
  isSaving,
}: {
  initial?: SavedAddress;
  onCancel: () => void;
  onDone: (draft: Draft) => Promise<void> | void;
  isSaving?: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(initial ?? EMPTY_DRAFT);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onDone({
      ...draft,
      label: draft.label.trim() || "Address",
      fullName: draft.fullName.trim(),
      phone: draft.phone.trim(),
      street: draft.street.trim(),
      city: draft.city.trim(),
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-sm"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {initial ? "Edit delivery address" : "Add delivery address"}
          </h3>
          <p className="text-xs text-muted">
            Addresses are used for instant checkout and shipping rate calculations.
          </p>
        </div>

        {/* Quick label chips */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-0">
          {PRESET_LABELS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => set("label", preset)}
              className={cn(
                "press rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                draft.label.toLowerCase() === preset.toLowerCase()
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "bg-surface-muted text-muted hover:text-foreground",
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="address-label"
          label="Address label"
          placeholder="e.g. Home, Office, Studio"
          value={draft.label}
          onChange={(e) => set("label", e.target.value)}
        />
        <Field
          id="address-name"
          label="Contact full name"
          autoComplete="name"
          required
          placeholder="Recipient full name"
          value={draft.fullName}
          onChange={(e) => set("fullName", e.target.value)}
        />
        <Field
          id="address-phone"
          label="Contact phone number"
          type="tel"
          autoComplete="tel"
          required
          placeholder="024 123 4567"
          value={draft.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
        <Field
          id="address-city"
          label="City / Town"
          autoComplete="address-level2"
          required
          placeholder="e.g. Accra, Tema, Kumasi"
          value={draft.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <Field
          id="address-street"
          label="Street address / Landmark"
          autoComplete="street-address"
          required
          placeholder="House No., Street name, Landmark, GhanaPost GPS"
          value={draft.street}
          onChange={(e) => set("street", e.target.value)}
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <label htmlFor="address-region" className="mb-1.5 block text-sm font-medium">
            Region
          </label>
          <select
            id="address-region"
            value={draft.region}
            onChange={(e) => set("region", e.target.value)}
            className={inputClass}
          >
            {GHANA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2 pt-1 select-none">
          <input
            type="checkbox"
            checked={Boolean(draft.isDefault)}
            onChange={(e) => set("isDefault", e.target.checked)}
            className="size-4 rounded accent-accent"
          />
          <span className="text-sm font-medium text-foreground">
            Set as primary / default shipping address
          </span>
        </label>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" variant="accent" disabled={isSaving}>
          {isSaving ? "Saving…" : initial ? "Save changes" : "Add address"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: SavedAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border p-5 transition-all",
        address.isDefault
          ? "border-accent/40 bg-surface shadow-sm ring-1 ring-accent/20"
          : "border-line bg-surface hover:border-foreground/20 hover:shadow-xs",
      )}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                address.isDefault
                  ? "bg-accent/15 text-accent"
                  : "bg-surface-muted text-muted group-hover:text-foreground",
              )}
            >
              {getAddressIcon(address.label)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground capitalize leading-snug">
                  {address.label}
                </h3>
                {address.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                    <Check className="size-3 stroke-[2.5]" aria-hidden /> Default
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">{address.region}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              title={`Edit ${address.label}`}
              className="press grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title={`Remove ${address.label}`}
              className="press grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Address & Contact Information */}
        <div className="mt-4 space-y-2 border-t border-line/60 pt-3.5 text-sm">
          <div className="flex items-center gap-2.5 font-medium text-foreground">
            <User className="size-3.5 shrink-0 text-muted" aria-hidden />
            <span className="truncate">{address.fullName}</span>
          </div>

          <div className="flex items-start gap-2.5 text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
            <span className="leading-snug">
              {address.street}, {address.city}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-muted">
            <Phone className="size-3.5 shrink-0 text-muted" aria-hidden />
            <span className="font-mono text-xs">{address.phone}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3 text-xs">
        {address.isDefault ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-accent">
            <CheckCircle2 className="size-3.5" aria-hidden /> Primary shipping address
          </span>
        ) : (
          <button
            type="button"
            onClick={onSetDefault}
            className="press font-medium text-accent hover:underline"
          >
            Set as default
          </button>
        )}

        <button
          type="button"
          onClick={onEdit}
          className="press inline-flex items-center gap-1 font-medium text-muted hover:text-foreground"
        >
          <Pencil className="size-3" aria-hidden /> Edit
        </button>
      </div>
    </div>
  );
}

export function AddressSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading addresses">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="flex min-h-[200px] flex-col justify-between rounded-2xl border border-line bg-surface p-5 animate-pulse"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 shrink-0 rounded-xl bg-surface-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 rounded-md bg-surface-muted" />
                  <div className="h-3 w-28 rounded-md bg-surface-muted" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-8 rounded-lg bg-surface-muted" />
                <div className="size-8 rounded-lg bg-surface-muted" />
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-line/60 pt-3">
              <div className="h-3.5 w-36 rounded-md bg-surface-muted" />
              <div className="h-3 w-52 rounded-md bg-surface-muted" />
              <div className="h-3 w-32 rounded-md bg-surface-muted" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
            <div className="h-3.5 w-24 rounded-md bg-surface-muted" />
            <div className="h-3.5 w-12 rounded-md bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AddAddressCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface/40 p-6 text-center transition-all hover:border-accent hover:bg-accent-soft/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-muted transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
        <Plus className="size-5" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground group-hover:text-accent">
          Add a new address
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Save delivery location for fast checkout
        </p>
      </div>
    </button>
  );
}

export function AddressTab() {
  const { addresses, addAsync, updateAsync, remove, setDefault, isSaving, isLoading } =
    useAddresses();
  const [formParam, setFormParam] = useQueryParam("address");
  const adding = formParam === "new";
  const editingId = adding ? null : formParam;
  const setAdding = (next: boolean) => setFormParam(next ? "new" : null);
  const setEditingId = (id: string | null) => setFormParam(id);

  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const editing = addresses.find((a) => a.id === editingId);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await remove(deleteTarget.id);
      toast.success("Address removed");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to remove address");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isLoading && addresses.length === 0 ? (
        <AddressSkeleton />
      ) : addresses.length === 0 && !adding ? (
        <EmptyState
          icon={<MapPin className="size-8 text-muted" />}
          iconBadge
          title="No saved addresses"
          description="You haven't saved any delivery locations yet. Add an address to make your checkout quick and easy."
          action={
            <Button variant="accent" onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Add your first address
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) =>
            editingId === address.id ? (
              <div key={address.id} className="sm:col-span-2">
                <AddressForm
                  initial={editing}
                  isSaving={isSaving}
                  onCancel={() => setEditingId(null)}
                  onDone={async (draft) => {
                    try {
                      await updateAsync(address.id, draft);
                      toast.success("Address updated");
                      setEditingId(null);
                    } catch {
                      toast.error("Failed to update address");
                    }
                  }}
                />
              </div>
            ) : (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => setEditingId(address.id)}
                onDelete={() => setDeleteTarget(address)}
                onSetDefault={() => setDefault(address.id)}
              />
            ),
          )}

          {adding ? (
            <div className="sm:col-span-2">
              <AddressForm
                onCancel={() => setAdding(false)}
                isSaving={isSaving}
                onDone={async (draft) => {
                  try {
                    await addAsync(draft);
                    toast.success("Address added");
                    setAdding(false);
                  } catch {
                    toast.error("Failed to add address");
                  }
                }}
              />
            </div>
          ) : (
            <AddAddressCard onClick={() => setAdding(true)} />
          )}
        </div>
      )}

      {/* Confirmation dialog for address deletion */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Remove ${deleteTarget?.label ?? "address"}?`}
        description={`Are you sure you want to remove the address for ${deleteTarget?.fullName ?? "this location"} (${deleteTarget?.street ?? ""})? This cannot be undone.`}
        confirmLabel={isDeleting ? "Removing…" : "Remove address"}
        cancelLabel="Keep address"
        pending={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
