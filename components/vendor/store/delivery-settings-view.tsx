"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { QueryError } from "@/components/ui/query-error";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel, PanelHeader } from "@/components/vendor/vendor-ui";
import { formatMoney } from "@/libs/format";
import { useSaveVendorDeliverySettings, useVendorDeliverySettings } from "@/hooks/use-vendor-store";

/**
 * An empty box means "use the ODOS default" and sends `null`; a typed `0` means "I deliver free"
 * and sends zero. Conflating the two is the whole reason this screen shows the default as
 * placeholder text rather than pre-filling it.
 */
const parseFee = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

export function DeliverySettingsView() {
  const query = useVendorDeliverySettings();
  const save = useSaveVendorDeliverySettings();
  const [form, setForm] = useState<Record<string, string>>({});
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  if (query.isError) {
    return <QueryError title="We couldn't load your delivery settings" error={query.error} onRetry={() => query.refetch()} />;
  }
  if (query.isPending || !query.data) {
    return <div className="h-80 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  }

  const d = query.data;
  const field = (key: string, stored: number | null) => form[key] ?? (stored === null ? "" : String(stored));
  const toggle = (key: string, stored: boolean) => toggles[key] ?? stored;

  const FEES: { key: string; label: string; stored: number | null; fallback: number; hint: string }[] = [
    { key: "economyFee", label: "Economy delivery", stored: d.economyFee, fallback: d.defaultEconomyFee, hint: "Your standard rate." },
    { key: "expressFee", label: "Express delivery", stored: d.expressFee, fallback: d.defaultExpressFee, hint: "Faster, priced higher." },
    { key: "sameDayFee", label: "Same-day delivery", stored: d.sameDayFee, fallback: d.defaultSameDayFee, hint: "Ordered and delivered today." },
    {
      key: "freeDeliveryThreshold",
      label: "Free delivery over",
      stored: d.freeDeliveryThreshold,
      fallback: d.defaultFreeDeliveryThreshold,
      hint: "Basket total at which you stop charging. 0 means always free.",
    },
  ];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // The API rejects anything over these with a 400; catching it here keeps the vendor out of
    // a round-trip that just tells them off.
    const fees = [
      ["Economy", parseFee(field("economyFee", d.economyFee)), d.maxFee],
      ["Express", parseFee(field("expressFee", d.expressFee)), d.maxFee],
      ["Same-day", parseFee(field("sameDayFee", d.sameDayFee)), d.maxFee],
      ["Free-delivery threshold", parseFee(field("freeDeliveryThreshold", d.freeDeliveryThreshold)), d.maxFreeDeliveryThreshold],
    ] as const;
    for (const [label, value, cap] of fees) {
      if (value !== null && value > cap) {
        setError(`${label} can't be more than ${formatMoney(cap)}.`);
        return;
      }
    }

    save.mutate(
      {
        economyFee: parseFee(field("economyFee", d.economyFee)),
        expressFee: parseFee(field("expressFee", d.expressFee)),
        sameDayFee: parseFee(field("sameDayFee", d.sameDayFee)),
        freeDeliveryThreshold: parseFee(field("freeDeliveryThreshold", d.freeDeliveryThreshold)),
        expressEnabled: toggle("expressEnabled", d.expressEnabled),
        sameDayEnabled: toggle("sameDayEnabled", d.sameDayEnabled),
      },
      {
        onSuccess: () => toast.success("Delivery settings saved"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't save your delivery settings."),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <PageHeader
        title="Delivery"
        description="What you charge to deliver. New prices apply to future orders only."
        actions={
          <>
            {d.badge && <Badge tone="accent">{d.badge}</Badge>}
            <Badge tone="neutral">{d.isCustom ? "Custom rates" : "ODOS defaults"}</Badge>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel>
            <PanelHeader title="Your rates" />
            <div className="space-y-4 p-5">
              <p className="rounded-xl bg-surface-muted p-3 text-xs text-muted">
                Leave a box empty to use the ODOS default shown inside it. Typing <strong>0</strong> is different — it
                means you deliver that tier free.
              </p>
              {FEES.map((fee) => (
                <label key={fee.key} className="block">
                  <span className="mb-1.5 block text-sm font-medium">{fee.label}</span>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={field(fee.key, fee.stored)}
                    placeholder={`ODOS default: ${formatMoney(fee.fallback)}`}
                    onChange={(e) => setForm((f) => ({ ...f, [fee.key]: e.target.value.replace(/[^0-9.]/g, "") }))}
                  />
                  <span className="mt-1 block text-xs text-muted">
                    {fee.hint}
                    {fee.stored === null && " Currently using the ODOS default."}
                    {` Max ${formatMoney(fee.key === "freeDeliveryThreshold" ? d.maxFreeDeliveryThreshold : d.maxFee)}.`}
                  </span>
                </label>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Tiers you offer" />
            <div className="space-y-3 p-5">
              {([
                ["expressEnabled", "Express delivery", d.expressEnabled],
                ["sameDayEnabled", "Same-day delivery", d.sameDayEnabled],
              ] as const).map(([key, label, stored]) => (
                <label key={key} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={toggle(key, stored)}
                    onChange={(e) => setToggles((t) => ({ ...t, [key]: e.target.checked }))}
                    className="size-4 accent-[var(--accent)]"
                  />
                  Offer {label.toLowerCase()}
                </label>
              ))}
              <p className="flex items-start gap-2 pt-1 text-xs text-muted">
                <Truck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Turning a tier off hides it at checkout for your products.
              </p>
            </div>
          </Panel>

          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save delivery settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}
