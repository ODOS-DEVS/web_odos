"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { LogoPill, TogglePill } from "@/components/ui/toggle-pill";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useWallet } from "@/hooks/use-wallet";
import { formatDateTime, formatMoney } from "@/libs/format";

const QUICK_AMOUNTS = [50, 100, 200, 500];

function TopUpForm() {
  const { methods } = usePaymentMethods();
  const { topUpAsync, isPending } = useWallet();

  const [amount, setAmount] = useState<number | "">(100);
  const [methodId, setMethodId] = useState(methods[0]?.id);
  const method = methods.find((m) => m.id === methodId) ?? methods[0];

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amount || amount <= 0 || !method) return;
    try {
      await topUpAsync(Number(amount), method.label, method.id);
      toast.success(`${formatMoney(Number(amount))} added to your wallet`);
      setAmount(100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Top-up failed");
    }
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

      <Button type="submit" variant="accent" size="lg" className="mt-5 w-full" disabled={isPending || !amount || !method}>
        {isPending ? "Topping up…" : `Top up ${amount ? formatMoney(Number(amount)) : ""}`}
      </Button>
    </form>
  );
}

export function WalletSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading wallet">
      {/* Balance Card Skeleton */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="size-4 rounded bg-surface-muted" />
          <div className="h-4 w-28 rounded-md bg-surface-muted" />
        </div>
        <div className="mt-3 h-10 w-48 rounded-lg bg-surface-muted" />
      </div>

      {/* Top Up Card Skeleton */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 animate-pulse space-y-4">
        <div className="h-5 w-32 rounded-md bg-surface-muted" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-9 w-20 rounded-full bg-surface-muted" />
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-16 rounded-md bg-surface-muted" />
          <div className="h-11 w-full rounded-xl bg-surface-muted" />
        </div>
        <div className="h-11 w-full rounded-full bg-surface-muted mt-5" />
      </div>
    </div>
  );
}

export function WalletTab() {
  const { balance, transactions, isLoading } = useWallet();

  if (isLoading && balance === 0) {
    return <WalletSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-3 text-sm text-muted">
          <Wallet className="size-4" aria-hidden />
          Available balance
        </div>
        <p className="mt-2 text-4xl font-semibold tabular-nums">
          {isLoading && balance === 0 ? "Loading…" : formatMoney(balance)}
        </p>
      </div>

      <TopUpForm />

      {transactions.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-normal">Recent top-ups</h2>
          <ul className="mt-4 divide-y divide-line">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Wallet top-up</p>
                    <p className="text-xs text-muted">
                      {tx.methodLabel} · {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="font-medium tabular-nums text-success">+{formatMoney(tx.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
