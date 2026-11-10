"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { forgetPendingPayment } from "@/libs/pending-payment";
import { formatMoney } from "@/libs/format";
import { queryKeys, walletTopUpQueries } from "@/services/queries";

/**
 * Confirms a top-up the shopper has just come back from paying.
 *
 * Shown in place on the wallet rather than on a page of its own, because the
 * balance is the thing they are waiting to see change. Verifying is also what
 * credits the top-up -- see walletService.verifyTopUp -- so this has to run,
 * not merely report.
 */
export function TopUpResult({ reference }: { reference: string }) {
  const queryClient = useQueryClient();
  const verification = useQuery({ ...walletTopUpQueries.verify(reference), enabled: Boolean(reference) });

  const paid = verification.data?.paid === true;
  useEffect(() => {
    if (!paid) return;
    // The balance and the transaction list both changed behind us.
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
  }, [paid, queryClient]);

  const settled = verification.data ? !verification.data.pending : false;
  useEffect(() => {
    if (!settled) return;
    forgetPendingPayment();
  }, [settled]);

  if (verification.isPending || verification.data?.pending) {
    return (
      <Banner tone="muted">
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        <span>
          Waiting for your top-up to come through. Approve the prompt on your phone — your balance
          updates here by itself.
        </span>
      </Banner>
    );
  }

  if (verification.isError) {
    return (
      <Banner tone="warning">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <span>
          We couldn’t confirm your top-up just now. If you were charged, it will appear in your
          wallet shortly.
        </span>
      </Banner>
    );
  }

  if (paid) {
    return (
      <Banner tone="success">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        <span>{formatMoney(verification.data.amount)} added to your wallet.</span>
      </Banner>
    );
  }

  return (
    <Banner tone="warning">
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      <span>{verification.data?.message || "That top-up didn’t go through, and you haven’t been charged."}</span>
    </Banner>
  );
}

const TONES = {
  muted: "border-line bg-surface-muted text-muted",
  success: "border-success/30 bg-success-soft text-foreground",
  warning: "border-warning/30 bg-warning-soft text-foreground",
} as const;

function Banner({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}
