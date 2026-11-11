"use client";

import { useState, type FormEvent } from "react";
import { Banknote, Landmark, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { QueryError } from "@/components/ui/query-error";
import { TogglePill } from "@/components/ui/toggle-pill";
import {
  useRequestVendorWithdrawal,
  useSaveVendorPayoutDetails,
  useVendorPayoutInstitutions,
  useVendorWallet,
} from "@/hooks/use-vendor-ops";
import { formatDate, formatMoney } from "@/libs/format";
import type { VendorWallet } from "@/types/vendor";

/** Mirrors the API's vendor_withdrawal_minimum; the server enforces it either way. */
const WITHDRAWAL_MINIMUM = 20;

const WITHDRAWAL_TONE: Record<string, BadgeTone> = {
  pending: "warning",
  approved: "accent",
  processing: "accent",
  paid: "success",
  rejected: "danger",
  failed: "danger",
};

function PayoutDetailsForm({ wallet, onClose }: { wallet: VendorWallet; onClose: () => void }) {
  const saveDetails = useSaveVendorPayoutDetails();
  const [method, setMethod] = useState<"mobile_money" | "bank_transfer">(
    wallet.payoutMethodType === "bank_transfer" ? "bank_transfer" : "mobile_money",
  );
  const institutions = useVendorPayoutInstitutions(method);
  const [provider, setProvider] = useState(wallet.payoutProvider ?? "");
  const [accountName, setAccountName] = useState(wallet.payoutAccountName ?? "");
  const [accountNumber, setAccountNumber] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!provider) {
      toast.error(method === "mobile_money" ? "Choose the mobile money provider." : "Choose the bank.");
      return;
    }
    saveDetails.mutate(
      { payoutMethodType: method, payoutAccountName: accountName, payoutAccountNumber: accountNumber, payoutProvider: provider },
      {
        onSuccess: () => {
          toast.success("Payout details saved");
          onClose();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn’t save those details."),
      },
    );
  };

  return (
    <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-5">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Payout method</legend>
        <div className="flex gap-2">
          <TogglePill
            selected={method === "mobile_money"}
            onClick={() => {
              setMethod("mobile_money");
              setProvider("");
            }}
          >
            <Smartphone className="mr-1 inline size-4" aria-hidden />
            Mobile money
          </TogglePill>
          <TogglePill
            selected={method === "bank_transfer"}
            onClick={() => {
              setMethod("bank_transfer");
              setProvider("");
            }}
          >
            <Landmark className="mr-1 inline size-4" aria-hidden />
            Bank transfer
          </TogglePill>
        </div>
      </fieldset>

      <div>
        <label htmlFor="payout-provider" className="mb-1.5 block text-sm font-medium">
          {method === "mobile_money" ? "Provider" : "Bank"}
        </label>
        <select
          id="payout-provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          disabled={institutions.isPending}
          className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base sm:text-sm focus:border-foreground focus:outline-none disabled:opacity-50"
          required
        >
          <option value="" disabled>
            {institutions.isPending ? "Loading…" : "Choose one"}
          </option>
          {(institutions.data ?? []).map((inst) => (
            <option key={inst.code} value={inst.name}>
              {inst.name}
            </option>
          ))}
        </select>
      </div>

      <Field
        id="payout-account-name"
        label="Account name"
        value={accountName}
        onChange={(e) => setAccountName(e.target.value)}
        placeholder="As registered with the provider"
        minLength={2}
        required
      />
      <Field
        id="payout-account-number"
        label={method === "mobile_money" ? "Mobile money number" : "Account number"}
        hint={
          wallet.payoutAccountNumberMasked ? (
            <span className="text-muted">currently {wallet.payoutAccountNumberMasked}</span>
          ) : undefined
        }
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
        inputMode={method === "mobile_money" ? "tel" : "numeric"}
        placeholder={method === "mobile_money" ? "024 123 4567" : ""}
        minLength={4}
        required
      />

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saveDetails.isPending}>
          {saveDetails.isPending ? "Saving…" : "Save payout details"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} disabled={saveDetails.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function VendorWalletTab() {
  const wallet = useVendorWallet();
  const withdraw = useRequestVendorWithdrawal();

  const [editingPayout, setEditingPayout] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (wallet.isPending) return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  if (wallet.isError) return <QueryError error={wallet.error} onRetry={() => wallet.refetch()} />;

  const w = wallet.data;
  if (!w) return null;

  const hasPayoutDetails = Boolean(w.payoutMethodType && w.payoutAccountNumberMasked);
  const requested = Number(amount);
  const amountValid = Number.isFinite(requested) && requested >= WITHDRAWAL_MINIMUM && requested <= w.availableBalance;

  const submitWithdrawal = () => {
    withdraw.mutate(
      { amount: requested, note: note || undefined },
      {
        onSuccess: () => {
          setConfirming(false);
          setAmount("");
          setNote("");
          toast.success("Withdrawal requested — ODOS reviews it before paying out.");
        },
        onError: (e) => {
          setConfirming(false);
          toast.error(e instanceof Error ? e.message : "We couldn’t submit that withdrawal.");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Available</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(w.availableBalance)}</p>
          <p className="mt-0.5 text-xs text-muted">Ready to withdraw</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Pending withdrawals</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(w.pendingWithdrawalBalance)}</p>
          <p className="mt-0.5 text-xs text-muted">Awaiting ODOS review</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Lifetime earnings</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(w.lifetimeEarnings)}</p>
          <p className="mt-0.5 text-xs text-muted">{formatMoney(w.totalWithdrawn)} withdrawn so far</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">ODOS commission</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(w.totalCommission)}</p>
          <p className="mt-0.5 text-xs text-muted">{(w.commissionRate * 100).toFixed(1)}% of goods sold</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-semibold tracking-normal">Payout account</h3>
          {hasPayoutDetails ? (
            <div className="mt-3 flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">
                  {w.payoutProvider} · {w.payoutAccountNumberMasked}
                </p>
                <p className="mt-0.5 text-muted">
                  {w.payoutAccountName} · {w.payoutMethodType === "bank_transfer" ? "Bank transfer" : "Mobile money"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditingPayout(true)}>
                Change
              </Button>
            </div>
          ) : (
            <div className="mt-3 text-sm">
              <p className="text-muted">Add where your money should go before requesting a withdrawal.</p>
              <Button size="sm" className="mt-3" onClick={() => setEditingPayout(true)}>
                Add payout details
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-semibold tracking-normal">Withdraw</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!hasPayoutDetails) {
                toast.error("Add your payout details first.");
                return;
              }
              if (!amountValid) {
                toast.error(
                  requested > w.availableBalance
                    ? "That’s more than your available balance."
                    : `Withdrawals start at ${formatMoney(WITHDRAWAL_MINIMUM)}.`,
                );
                return;
              }
              setConfirming(true);
            }}
            className="mt-3 space-y-3"
          >
            <Field
              id="withdraw-amount"
              label={`Amount (${w.currency})`}
              hint={<span className="text-muted">min {formatMoney(WITHDRAWAL_MINIMUM)}</span>}
              type="number"
              min={WITHDRAWAL_MINIMUM}
              max={Math.max(w.availableBalance, WITHDRAWAL_MINIMUM)}
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <Field
              id="withdraw-note"
              label="Note"
              hint={<span className="text-muted">optional</span>}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={255}
            />
            <Button type="submit" disabled={withdraw.isPending || w.availableBalance < WITHDRAWAL_MINIMUM}>
              <Banknote className="size-4" aria-hidden />
              Request withdrawal
            </Button>
            {w.availableBalance < WITHDRAWAL_MINIMUM && (
              <p className="text-xs text-muted">
                You need at least {formatMoney(WITHDRAWAL_MINIMUM)} available to withdraw.
              </p>
            )}
          </form>
        </section>
      </div>

      {w.withdrawalRequests.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold tracking-normal">Withdrawal requests</h3>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {w.withdrawalRequests.map((req) => (
              <li key={req.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">{formatMoney(req.amount)}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {req.payoutProvider ?? req.payoutMethodType} · {req.payoutAccountNumberMasked} ·{" "}
                    <time dateTime={req.createdAt}>{formatDate(req.createdAt)}</time>
                  </p>
                  {(req.adminNote || req.transferFailureReason) && (
                    <p className="mt-0.5 text-xs text-danger">{req.transferFailureReason ?? req.adminNote}</p>
                  )}
                </div>
                <Badge tone={WITHDRAWAL_TONE[req.status] ?? "neutral"} className="shrink-0">
                  {req.status.replace(/_/g, " ")}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 font-semibold tracking-normal">Recent activity</h3>
        {w.recentTransactions.length > 0 ? (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {w.recentTransactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{tx.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    <time dateTime={tx.createdAt}>{formatDate(tx.createdAt)}</time>
                    {tx.commissionAmount !== null && tx.commissionAmount > 0 && (
                      <> · after {formatMoney(tx.commissionAmount)} commission</>
                    )}
                  </p>
                </div>
                <p className={`shrink-0 font-semibold tabular-nums ${tx.amount < 0 ? "" : "text-success"}`}>
                  {tx.amount < 0 ? "−" : "+"}
                  {formatMoney(Math.abs(tx.amount))}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
            Your share of each delivered order lands here, and withdrawals leave from here.
          </p>
        )}
      </section>

      <Drawer open={editingPayout} onClose={() => setEditingPayout(false)} title="Payout details" labelId="vendor-payout-details-heading">
        {editingPayout && <PayoutDetailsForm wallet={w} onClose={() => setEditingPayout(false)} />}
      </Drawer>

      <ConfirmDialog
        open={confirming}
        title={`Withdraw ${amountValid ? formatMoney(requested) : ""}?`}
        description={`It goes to ${w.payoutProvider ?? "your payout account"} ${w.payoutAccountNumberMasked ?? ""} once ODOS approves the request.`}
        confirmLabel={withdraw.isPending ? "Requesting…" : "Request withdrawal"}
        pending={withdraw.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={submitWithdrawal}
      />
    </div>
  );
}
