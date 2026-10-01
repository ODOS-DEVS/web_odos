"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { LogoBadge, type Logo } from "@/components/checkout/logo-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { LogoPill, TogglePill } from "@/components/ui/toggle-pill";
import { usePaymentMethods, type SavedPaymentMethod } from "@/hooks/use-payment-methods";

const NETWORKS: { id: string; label: string; logo: Logo }[] = [
  { id: "mtn", label: "MTN MoMo", logo: { kind: "image", src: "/payment-logos/mtn-official.png", alt: "MTN" } },
  { id: "telecel", label: "Telecel Cash", logo: { kind: "image", src: "/payment-logos/telecel-icon.png", alt: "Telecel" } },
  { id: "at", label: "AT Money", logo: { kind: "image", src: "/payment-logos/at-official.png", alt: "AT" } },
];

function AddMethodForm({ onDone }: { onDone: () => void }) {
  const { add } = usePaymentMethods();
  const [type, setType] = useState<"momo" | "card">("momo");
  const [network, setNetwork] = useState(NETWORKS[0]);
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const method: Omit<SavedPaymentMethod, "id"> =
      type === "momo"
        ? { kind: "momo", label: network.label, subtitle: `${network.label} · ${phone.trim()}`, logo: network.logo }
        : {
            kind: "card",
            label: `**** ${cardNumber.trim().slice(-4) || "0000"}`,
            subtitle: `Card · ${expiry.trim() || "--/--"}`,
            logo: { kind: "monogram", text: "••", bg: "#1f2937", fg: "#ffffff" },
          };
    add(method);
    toast.success("Payment method added");
    onDone();
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex gap-2">
        <TogglePill selected={type === "momo"} onClick={() => setType("momo")}>
          Mobile money
        </TogglePill>
        <TogglePill selected={type === "card"} onClick={() => setType("card")}>
          Card
        </TogglePill>
      </div>

      {type === "momo" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((n) => (
              <LogoPill key={n.id} selected={network.id === n.id} logo={n.logo} label={n.label} onClick={() => setNetwork(n)} />
            ))}
          </div>
          <Field id="momo-phone" label="Phone number" type="tel" required placeholder="024 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="card-number" label="Card number" required placeholder="4242 4242 4242 4242" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="sm:col-span-2" />
          <Field id="card-expiry" label="Expiry" required placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
      )}

      <div className="mt-5 flex gap-2.5">
        <Button type="submit" variant="accent">
          Save method
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function MethodRow({ method }: { method: SavedPaymentMethod }) {
  const { remove, setDefault } = usePaymentMethods();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
      <LogoBadge logo={method.logo} className="size-10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{method.label}</p>
          {method.isDefault && <Badge tone="neutral">Default</Badge>}
        </div>
        <p className="truncate text-xs text-muted">{method.subtitle}</p>
      </div>
      {!method.isDefault && (
        <button type="button" onClick={() => setDefault(method.id)} className="press shrink-0 text-xs font-medium text-accent hover:opacity-80">
          Make default
        </button>
      )}
      <button
        type="button"
        onClick={() => remove(method.id)}
        aria-label={`Remove ${method.label}`}
        className="press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function PaymentMethodsTab() {
  const { methods } = usePaymentMethods();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      {methods.map((method) => (
        <MethodRow key={method.id} method={method} />
      ))}

      {adding ? (
        <AddMethodForm onDone={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden />
          Add payment method
        </Button>
      )}
    </div>
  );
}
