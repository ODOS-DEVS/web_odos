"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { GHANA_REGIONS } from "@/libs/checkout";
import { useAddresses, type SavedAddress } from "@/hooks/use-addresses";

type Draft = Omit<SavedAddress, "id">;

const EMPTY_DRAFT: Draft = { label: "Home", fullName: "", phone: "", street: "", city: "", region: "Greater Accra" };

function AddressForm({ initial, onCancel, onDone }: { initial?: SavedAddress; onCancel: () => void; onDone: (draft: Draft) => void }) {
  const [draft, setDraft] = useState<Draft>(initial ?? EMPTY_DRAFT);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onDone({ ...draft, label: draft.label.trim() || "Address", fullName: draft.fullName.trim(), phone: draft.phone.trim(), street: draft.street.trim(), city: draft.city.trim() });
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="address-label" label="Label" placeholder="Home, Office…" value={draft.label} onChange={(e) => set("label", e.target.value)} />
        <Field id="address-name" label="Full name" autoComplete="name" required value={draft.fullName} onChange={(e) => set("fullName", e.target.value)} />
        <Field id="address-phone" label="Phone number" type="tel" autoComplete="tel" required value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
        <Field id="address-city" label="City or town" autoComplete="address-level2" required value={draft.city} onChange={(e) => set("city", e.target.value)} />
        <Field id="address-street" label="Street address" autoComplete="street-address" required value={draft.street} onChange={(e) => set("street", e.target.value)} className="sm:col-span-2" />
        <div>
          <label htmlFor="address-region" className="mb-1.5 block text-sm font-medium">
            Region
          </label>
          <select id="address-region" value={draft.region} onChange={(e) => set("region", e.target.value)} className={inputClass}>
            {GHANA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        <Button type="submit" variant="accent">
          Save address
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AddressRow({ address, onEdit }: { address: SavedAddress; onEdit: () => void }) {
  const { remove, setDefault } = useAddresses();

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 text-accent" aria-hidden />
        <p className="font-semibold">{address.label}</p>
        {address.isDefault && <Badge tone="neutral">Default</Badge>}
      </div>
      
      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium">{address.fullName}</p>
        <p className="text-sm text-muted">
          {address.street}, {address.city}, {address.region}
        </p>
        <p className="text-sm text-muted">{address.phone}</p>
      </div>

      <div className="mt-5 flex items-center gap-5 border-t border-line pt-4">
        <button type="button" onClick={onEdit} className="press flex items-center gap-1.5 text-xs font-medium text-accent hover:opacity-80">
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </button>
        {!address.isDefault && (
          <button type="button" onClick={() => setDefault(address.id)} className="press text-xs font-medium text-accent hover:opacity-80">
            Make default
          </button>
        )}
        <button
          type="button"
          onClick={() => remove(address.id)}
          className="press flex items-center gap-1.5 text-xs font-medium text-muted hover:text-danger"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Remove
        </button>
      </div>
    </div>
  );
}

export function AddressTab() {
  const { addresses, add, update } = useAddresses();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = addresses.find((a) => a.id === editingId);

  return (
    <div className="space-y-4">
      {addresses.map((address) =>
        editingId === address.id ? (
          <AddressForm
            key={address.id}
            initial={editing}
            onCancel={() => setEditingId(null)}
            onDone={(draft) => {
              update(address.id, draft);
              toast.success("Address updated");
              setEditingId(null);
            }}
          />
        ) : (
          <AddressRow key={address.id} address={address} onEdit={() => setEditingId(address.id)} />
        ),
      )}

      {adding ? (
        <AddressForm
          onCancel={() => setAdding(false)}
          onDone={(draft) => {
            add(draft);
            toast.success("Address added");
            setAdding(false);
          }}
        />
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden />
          Add a new address
        </Button>
      )}
    </div>
  );
}
