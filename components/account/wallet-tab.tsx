"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { LogoPill, TogglePill } from "@/components/ui/toggle-pill";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useTopUpWallet, useWallet } from "@/hooks/use-wallet";
import { formatDateTime, formatMoney } from "@/libs/format";

const QUICK_AMOUNTS = [50, 100, 200, 500];

function TopUpForm() {
  const { methods } = usePaymentMethods();
  const topUpMutation = useTopUpWallet();

  const [amount, setAmount] = useState<number | "">(100);
  const [methodId, setMethodId] = useState(methods[0]?.id);
  const method = methods.find((m) => m.id === methodId) ?? methods[0];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amount || amount <= 0 || !method) return;
    topUpMutation.mutate(
      {
        amount,
        payment_type: method.kind,
        payment_label: method.label,
        callback_url: `${window.location.origin}/account?tab=wallet`,
        cancel_url: `${window.location.origin}/account?tab=wallet`,
      },
      {
        onSuccess: (session) => window.location.assign(session.authorizationUrl),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "We couldn't start your top-up. Please try again."),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-normal">Top up wallet</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <TogglePill key={value} selected={amount === value} onClick={() => setAmount(value)}>
            {formatMoney(value)}
          </TogglePill>
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor="amount" className="mb-1.5 block text-sm font-medium">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          min={1}
          step={1}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
          className={inputClass}
        />
      </div>

      {methods.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Pay with</p>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <LogoPill key={m.id} selected={methodId === m.id} logo={m.logo} label={m.label} onClick={() => setMethodId(m.id)} />
            ))}
          </div>
        </div>
      )}

      <Button type="submit" variant="accent" size="lg" className="mt-5 w-full" disabled={topUpMutation.isPending || !amount || !method}>
        {topUpMutation.isPending ? "Starting payment…" : `Top up ${amount ? formatMoney(Number(amount)) : ""}`}
      </Button>
    </form>
  );
}

export function WalletTab() {
  const { balance, transactions, isPending } = useWallet();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-3 text-sm text-muted">
          <Wallet className="size-4" aria-hidden />
          Available balance
        </div>
        {isPending ? (
          <div className="mt-2 h-10 w-40 animate-pulse rounded-lg bg-surface-muted" aria-busy="true" />
        ) : (
          <p className="mt-2 text-4xl font-semibold tabular-nums">{formatMoney(balance)}</p>
        )}
      </div>

      <TopUpForm />

      {transactions.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-normal">Recent activity</h2>
          <ul className="mt-4 divide-y divide-line">
            {transactions.map((tx) => {
              const credit = tx.amount >= 0;
              return (
                <li key={tx.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        credit
                          ? "grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success"
                          : "grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-muted"
                      }
                    >
                      {credit ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownLeft className="size-4" aria-hidden />}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{tx.title}</p>
                      <p className="text-xs text-muted">{formatDateTime(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className={credit ? "font-medium tabular-nums text-success" : "font-medium tabular-nums"}>
                    {credit ? "+" : "−"}
                    {formatMoney(Math.abs(tx.amount))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
