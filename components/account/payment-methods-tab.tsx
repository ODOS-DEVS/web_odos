"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { LogoBadge } from "@/components/checkout/logo-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { LogoPill, TogglePill } from "@/components/ui/toggle-pill";
import { QueryError } from "@/components/ui/query-error";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useQueryParam } from "@/hooks/use-query-param";
import { detectCardBrand, logoForMethod, MOMO_NETWORKS, subtitleForMethod } from "@/libs/payment-logos";
import { formatPhoneInput, validateGhanaPhone } from "@/libs/phone";
import type { SavedPaymentMethod } from "@/types/account";

function AddMethodForm({ onDone }: { onDone: () => void }) {
  const { add, isSaving } = usePaymentMethods();
  const [type, setType] = useState<"momo" | "card">("momo");
  const [network, setNetwork] = useState(MOMO_NETWORKS[0]);
  const [phone, setPhone] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [expiry, setExpiry] = useState("");

  const phoneError = validateGhanaPhone(phone);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (type === "momo" && (phoneError || !phone.trim())) return;

    const input =
      type === "momo"
        ? { type: "momo" as const, label: network.label, network: network.id, phone: phone.trim() }
        : {
            type: "card" as const,
            label: `•••• ${cardLast4}`,
            cardName: cardName.trim() || detectCardBrand(cardLast4).label,
            cardLast4,
            expiry: expiry.trim() || null,
          };

    add(input, {
      onSuccess: () => {
        toast.success("Payment method added");
        onDone();
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "We couldn't save that payment method"),
    });
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex gap-2">
        <TogglePill selected={type === "momo"} onClick={() => setType("momo")}>
          Mobile Money
        </TogglePill>
        <TogglePill selected={type === "card"} onClick={() => setType("card")}>
          Bank Card
        </TogglePill>
      </div>

      {type === "momo" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {MOMO_NETWORKS.map((n) => (
              <LogoPill key={n.id} selected={network.id === n.id} logo={n.logo} label={n.label} onClick={() => setNetwork(n)} />
            ))}
          </div>
          <Field
            id="momo-phone"
            label="Phone number"
            type="tel"
            inputMode="numeric"
            required
            placeholder="0240000000"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            error={phoneError ?? undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="card-name"
            label="Card type"
            placeholder="Visa, Mastercard…"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="sm:col-span-2"
          />
          <div>
            <Field
              id="card-last4"
              label="Last 4 digits"
              inputMode="numeric"
              maxLength={4}
              required
              placeholder="8451"
              value={cardLast4}
              onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            {cardLast4.length === 4 && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <LogoBadge logo={detectCardBrand(cardName).logo} className="size-5" />
                <span className="text-xs text-muted">{detectCardBrand(cardName).label}</span>
              </div>
            )}
          </div>
          <Field id="card-expiry" label="Expiry" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          {/* Only the last 4 digits are stored — the full card number and CVV are never collected
              or transmitted, so there is nothing here to leak. The card is charged on the
              provider's own hosted page at checkout. */}
          <p className="text-xs text-muted sm:col-span-2">
            This only saves a reference to the card. You’ll enter the full details on the secure payment page when you check out.
          </p>
        </div>
      )}

      <div className="mt-5 flex gap-2.5">
        <Button type="submit" variant="accent" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save method"}
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
      <LogoBadge logo={logoForMethod(method)} className="size-10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{method.label}</p>
          {method.isDefault && <Badge tone="neutral">Default</Badge>}
        </div>
        <p className="truncate text-xs text-muted">{subtitleForMethod(method)}</p>
      </div>
      {!method.isDefault && (
        <button
          type="button"
          onClick={() =>
            setDefault(method.id, {
              onSuccess: () => toast.success("Default payment method updated"),
              onError: () => toast.error("We couldn't update your default method"),
            })
          }
          className="press shrink-0 text-xs font-medium text-accent hover:opacity-80"
        >
          Make default
        </button>
      )}
      <button
        type="button"
        onClick={() =>
          remove(method.id, {
            onSuccess: () => toast.success("Payment method removed"),
            onError: () => toast.error("We couldn't remove that method"),
          })
        }
        aria-label={`Remove ${method.label}`}
        className="press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function PaymentMethodsTab() {
  const { methods, isPending, isError, error, refetch } = usePaymentMethods();
  const [addingParam, setAddingParam] = useQueryParam("payment");
  const adding = addingParam === "new";
  const setAdding = (next: boolean) => setAddingParam(next ? "new" : null);

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (isError) return <QueryError error={error} onRetry={() => refetch()} title="We couldn’t load your payment methods" />;

  return (
    <div className="space-y-4">
      {methods.length === 0 && !adding && (
        <EmptyState
          icon={<CreditCard className="size-6 text-muted" aria-hidden />}
          iconBadge
          title="No payment methods yet"
          description="Save a mobile money wallet or a card so checkout is quicker next time."
        />
      )}

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
