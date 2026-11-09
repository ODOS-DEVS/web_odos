"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowDownRight, Building2, CheckCircle2, CreditCard, DollarSign, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useVendorWallet } from "@/hooks/use-vendor";
import { formatMoney } from "@/libs/format";

export function VendorWalletSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading vendor wallet">
      <div className="rounded-2xl border border-line bg-surface p-6 animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-surface-muted" />
        <div className="h-8 w-48 rounded-md bg-surface-muted" />
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="h-16 rounded-xl bg-surface-muted" />
          <div className="h-16 rounded-xl bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}

export function VendorWalletTab() {
  const {
    wallet,
    isLoading,
    requestWithdrawal,
    isWithdrawing,
    updatePayoutDetails,
    isUpdatingPayout,
  } = useVendorWallet();

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [editingPayout, setEditingPayout] = useState(false);
  const [accountNumber, setAccountNumber] = useState(wallet?.payout_details?.account_number ?? "");
  const [accountName, setAccountName] = useState(wallet?.payout_details?.account_name ?? "");
  const [momoNetwork, setMomoNetwork] = useState(wallet?.payout_details?.momo_network ?? "MTN");

  if (isLoading && !wallet) {
    return <VendorWalletSkeleton />;
  }

  const available = wallet?.available_balance ?? 0;
  const pendingWithdrawal = wallet?.pending_withdrawal_balance ?? 0;
  const lifetime = wallet?.lifetime_earnings ?? 0;
  const commissionRate = (wallet?.commission_rate ?? 0.05) * 100;

  const onWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    const val = Number(withdrawAmount);
    if (!val || val <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (val > available) {
      toast.error("Withdrawal amount cannot exceed available balance");
      return;
    }
    try {
      await requestWithdrawal(val);
      toast.success(`Withdrawal request of ${formatMoney(val)} submitted`);
      setWithdrawAmount("");
    } catch {
      toast.error("Failed to request withdrawal");
    }
  };

  const onSavePayout = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updatePayoutDetails({
        payout_method_type: "mobile_money",
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        momo_network: momoNetwork,
      });
      toast.success("Payout details updated");
      setEditingPayout(false);
    } catch {
      toast.error("Failed to update payout details");
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Available for Payout</span>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
              {formatMoney(available)}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Standard payout processing takes 1 business day · {commissionRate}% platform fee
            </p>
          </div>

          <form onSubmit={onWithdraw} className="flex gap-2 items-center">
            <input
              type="number"
              min="10"
              max={available}
              placeholder="Amount (GH¢)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="h-10 w-36 rounded-full border border-line bg-surface-muted px-4 text-sm focus:border-foreground focus:outline-none"
            />
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={isWithdrawing || available < 10 || !withdrawAmount}
            >
              {isWithdrawing ? "Processing…" : "Withdraw"}
            </Button>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line/60 pt-4 sm:grid-cols-3">
          <div>
            <span className="text-xs text-muted">Pending Payouts</span>
            <p className="mt-1 font-semibold tabular-nums text-warning">{formatMoney(pendingWithdrawal)}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Lifetime Earnings</span>
            <p className="mt-1 font-semibold tabular-nums text-foreground">{formatMoney(lifetime)}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Total Commission Paid</span>
            <p className="mt-1 font-semibold tabular-nums text-muted">{formatMoney(wallet?.total_commission ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Payout Destination Account */}
      <section className="rounded-2xl border border-line bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="size-5 text-accent" />
            <h3 className="font-semibold text-base">Payout Destination</h3>
          </div>
          {!editingPayout && (
            <Button variant="outline" size="sm" onClick={() => setEditingPayout(true)}>
              {wallet?.payout_details?.account_number ? "Change details" : "Add payout account"}
            </Button>
          )}
        </div>

        {editingPayout ? (
          <form onSubmit={onSavePayout} className="space-y-4 border-t border-line/60 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                id="payout-name"
                label="Account / MoMo Name"
                placeholder="Account name as registered with network/bank"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
              <Field
                id="payout-number"
                label="Phone or Account Number"
                placeholder="024 000 0000"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="accent" size="sm" disabled={isUpdatingPayout}>
                {isUpdatingPayout ? "Saving…" : "Save payout account"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingPayout(false)} disabled={isUpdatingPayout}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-line/60 bg-surface-muted p-4 text-sm flex items-center justify-between">
            <div>
              <p className="font-semibold">{wallet?.payout_details?.account_name || "No payout account added"}</p>
              <p className="text-xs text-muted">
                {wallet?.payout_details?.account_number
                  ? `${wallet?.payout_details?.momo_network || "Mobile Money"} · ${wallet.payout_details.account_number}`
                  : "Add your mobile money number or bank account to receive automatic weekly payouts."}
              </p>
            </div>
            {wallet?.payout_details?.account_number && (
              <Badge tone="success" className="shrink-0">Verified</Badge>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

