"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useSession } from "@/hooks/use-auth";
import { useDirectPayMethods, useInitiateDirectPay, useVerifyDirectPay } from "@/hooks/use-direct-pay";
import { cn } from "@/libs/cn";

/** Payment statuses that still need paying. */
export const needsPayment = (paymentStatus: string, orderStatus: string) =>
  !/\bpaid\b|success|complete|captured|refund/.test(paymentStatus.toLowerCase()) && orderStatus !== "cancelled";

const VERIFY_EVERY_MS = 5_000;
const MAX_CHECKS = 24; // ~2 minutes of waiting for the MoMo prompt

/**
 * Pay an unpaid order directly: pick a provider from GET /payment-methods/available, send the prompt with
 * POST /payment-methods/initiate, then poll POST /payment-methods/verify until it settles.
 */
export function PayNow({ orderId }: { orderId: string }) {
  const session = useSession();
  const methods = useDirectPayMethods();
  const initiate = useInitiateDirectPay();
  const verify = useVerifyDirectPay();
  const [provider, setProvider] = useState<string | null>(null);
  const [phone, setPhone] = useState(session?.user.phone_number ?? "");
  const [waiting, setWaiting] = useState<{ provider: string; reference: string | null; checks: number } | null>(null);

  const list = methods.data ?? [];
  const selected = list.find((m) => m.provider === provider) ?? list[0] ?? null;

  // Poll verify while the shopper approves the prompt on their phone.
  useEffect(() => {
    if (!waiting) return;
    if (waiting.checks >= MAX_CHECKS) {
      setWaiting(null);
      toast.info("Still waiting on the payment. If you approved it, refresh in a minute.");
      return;
    }
    const t = setTimeout(() => {
      verify.mutate(
        { orderId, provider: waiting.provider, reference: waiting.reference },
        {
          onSuccess: (r) => {
            if (r.paid) {
              setWaiting(null);
              toast.success("Payment received. Thank you!");
            } else if (r.failed) {
              setWaiting(null);
              toast.error(r.message ?? "The payment didn’t go through.");
            } else setWaiting((w) => (w ? { ...w, checks: w.checks + 1 } : w));
          },
          onError: () => setWaiting((w) => (w ? { ...w, checks: w.checks + 1 } : w)),
        },
      );
    }, VERIFY_EVERY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, orderId]);

  if (methods.isPending) return <div className="mt-4 h-24 animate-pulse rounded-xl bg-surface-muted" />;
  if (methods.isError || list.length === 0) return null;

  const start = () => {
    if (!selected) return;
    if (selected.needsPhone && phone.trim().length < 9) return toast.error("Enter the mobile money number to charge");
    initiate.mutate(
      { orderId, provider: selected.provider, phone: selected.needsPhone ? phone : null },
      {
        onSuccess: (r) => {
          if (r.redirectUrl) return void (window.location.href = r.redirectUrl);
          if (r.paid) return void toast.success("Payment received. Thank you!");
          if (r.failed) return void toast.error(r.message ?? "We couldn’t start the payment.");
          toast.info(r.message ?? (selected.needsPhone ? "Check your phone and approve the prompt." : "Complete the payment to continue."));
          setWaiting({ provider: selected.provider, reference: r.reference, checks: 0 });
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      <p className="text-sm font-medium">Pay for this order</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment provider">
        {list.map((m) => (
          <button
            key={m.provider}
            type="button"
            role="radio"
            aria-checked={selected?.provider === m.provider}
            onClick={() => setProvider(m.provider)}
            disabled={Boolean(waiting)}
            className={cn(
              "press rounded-full border px-3.5 py-1.5 text-sm",
              selected?.provider === m.provider ? "border-foreground bg-foreground text-background" : "border-line hover:border-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {selected?.needsPhone && (
        <Field id="pay-now-phone" label="Mobile money number" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={Boolean(waiting)} />
      )}
      {waiting ? (
        <div className="flex items-center gap-2 rounded-xl bg-accent-soft p-3 text-sm text-accent">
          <Smartphone className="size-4 shrink-0 animate-pulse" aria-hidden />
          Waiting for you to approve the payment…
          <button type="button" className="ml-auto text-xs underline" onClick={() => setWaiting(null)}>
            Cancel
          </button>
        </div>
      ) : (
        <Button variant="accent" className="w-full" onClick={start} disabled={initiate.isPending}>
          {initiate.isPending ? "Starting…" : "Pay now"}
        </Button>
      )}
    </div>
  );
}
