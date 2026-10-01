"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Wallet } from "lucide-react";
import { LogoBadge } from "@/components/checkout/logo-badge";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useWallet } from "@/hooks/use-wallet";
import { useFakeMutation } from "@/mocks/mutation";
import { cn } from "@/libs/cn";
import { formatDateTime, formatMoney } from "@/libs/format";

const QUICK_AMOUNTS = [50, 100, 200, 500];

function mockTopUp(input: { amount: number }) {
  return input;
}

function TopUpForm() {
  const { methods } = usePaymentMethods();
  const { topUp } = useWallet();
  const topUpMutation = useFakeMutation(mockTopUp);

  const [amount, setAmount] = useState<number | "">(100);
  const [methodId, setMethodId] = useState(methods[0]?.id);
  const method = methods.find((m) => m.id === methodId) ?? methods[0];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amount || amount <= 0 || !method) return;
    topUpMutation.mutate(
      { amount },
      {
        onSuccess: () => {
          topUp(amount, method.label);
          toast.success(`${formatMoney(amount)} added to your wallet`);
          setAmount(100);
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-normal">Top up wallet</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(value)}
            className={cn(
              "press rounded-full border px-4 py-2 text-sm font-medium",
              amount === value ? "border-foreground bg-foreground text-background" : "border-line hover:border-foreground",
            )}
          >
            {formatMoney(value)}
          </button>
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
              <button
                key={m.id}
                type="button"
                onClick={() => setMethodId(m.id)}
                className={cn(
                  "press flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5 text-sm",
                  methodId === m.id ? "border-foreground" : "border-line hover:border-foreground",
                )}
              >
                <LogoBadge logo={m.logo} className="size-6" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" variant="accent" size="lg" className="mt-5 w-full" disabled={topUpMutation.isPending || !amount || !method}>
        {topUpMutation.isPending ? "Topping up…" : `Top up ${amount ? formatMoney(Number(amount)) : ""}`}
      </Button>
    </form>
  );
}

export function WalletTab() {
  const { balance, transactions } = useWallet();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-3 text-sm text-muted">
          <Wallet className="size-4" aria-hidden />
          Available balance
        </div>
        <p className="mt-2 text-4xl font-semibold tabular-nums">{formatMoney(balance)}</p>
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
