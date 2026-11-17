"use client";

import { toast } from "sonner";
import { LogOut, Store, User } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader, Panel, PanelHeader } from "@/components/vendor/vendor-ui";
import { useSession, useUpdateProfile } from "@/hooks/use-auth";
import type { UserRead } from "@/types/api";

type AlertKey = "vendor_notify_orders" | "vendor_notify_inventory" | "vendor_notify_reviews" | "vendor_notify_payouts";

const ALERTS: { key: AlertKey; title: string; description: string }[] = [
  { key: "vendor_notify_orders", title: "Orders and reminders", description: "New orders, and nudges about ones you haven't fulfilled." },
  { key: "vendor_notify_inventory", title: "Inventory", description: "Low-stock and out-of-stock warnings." },
  { key: "vendor_notify_reviews", title: "Reviews", description: "When a customer reviews one of your products." },
  { key: "vendor_notify_payouts", title: "Payouts", description: "Withdrawal approvals and payout status." },
];

function Toggle({
  checked,
  disabled,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex items-start gap-3 px-5 py-4">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
    </label>
  );
}

export function VendorSettingsView() {
  const user = useSession()?.user;
  const update = useUpdateProfile();

  if (!user) return null;

  const save = (key: AlertKey, value: boolean) =>
    update.mutate(
      { [key]: value },
      {
        onSuccess: () => toast.success("Alert preferences saved"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't save that preference."),
      },
    );

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="How ODOS contacts you about your store." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Seller alerts" />
          <div className="divide-y divide-line">
            {ALERTS.map((alert) => (
              <Toggle
                key={alert.key}
                title={alert.title}
                description={alert.description}
                checked={Boolean(user[alert.key as keyof UserRead])}
                disabled={update.isPending}
                onChange={(next) => save(alert.key, next)}
              />
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Account" />
            <div className="space-y-3 px-5 py-4 text-sm">
              <p className="flex items-center gap-2">
                <User className="size-4 shrink-0 text-muted" aria-hidden />
                {user.full_name} · {user.email}
              </p>
              <p className="text-xs text-muted">
                Your name, password and personal details live on your shopper account — they are the same login.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <ButtonLink href="/account" variant="outline" size="sm">
                  <User className="size-4" aria-hidden />
                  Account settings
                </ButtonLink>
                <ButtonLink href="/seller/store" variant="outline" size="sm">
                  <Store className="size-4" aria-hidden />
                  Store profile
                </ButtonLink>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Leaving the Seller Center" />
            <div className="px-5 py-4 text-sm">
              <p className="text-muted">Switch back to shopping any time — it is the same account.</p>
              <ButtonLink href="/" variant="outline" size="sm" className="mt-3">
                <LogOut className="size-4" aria-hidden />
                Back to storefront
              </ButtonLink>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
