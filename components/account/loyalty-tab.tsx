"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Award, Gift, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { QueryError } from "@/components/ui/query-error";
import { useLoyalty, useRedeemPoints } from "@/hooks/use-loyalty";
import { cn } from "@/libs/cn";
import { formatDateTime, formatMoney } from "@/libs/format";
import { POINTS_PER_GHS } from "@/types/loyalty";

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

function RedeemForm({ totalPoints }: { totalPoints: number }) {
  const redeem = useRedeemPoints();
  const [points, setPoints] = useState<number | "">(POINTS_PER_GHS);

  const amount = typeof points === "number" ? points : 0;
  // The backend rejects anything below one cedi's worth, or not a whole multiple of it.
  const invalid = amount < POINTS_PER_GHS || amount % POINTS_PER_GHS !== 0 || amount > totalPoints;

  const onRedeem = () =>
    redeem.mutate(amount, {
      onSuccess: (result) => {
        // A rejected amount comes back as 200 with `success: false`, not an error status.
        if (result.success) toast.success(result.message);
        else toast.error(result.message);
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "We couldn't redeem those points."),
    });

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-normal">Redeem points</h2>
      <p className="mt-1 text-sm text-muted">
        {POINTS_PER_GHS} points = {formatMoney(1)}. Redeemed points are added to your ODOS Wallet.
      </p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <input
          type="number"
          min={POINTS_PER_GHS}
          step={POINTS_PER_GHS}
          max={totalPoints}
          value={points}
          onChange={(e) => setPoints(e.target.value ? Number(e.target.value) : "")}
          aria-label="Points to redeem"
          className={cn(inputClass, "sm:flex-1")}
        />
        <Button type="button" variant="accent" onClick={onRedeem} disabled={invalid || redeem.isPending} className="sm:w-auto">
          {redeem.isPending ? "Redeeming…" : `Redeem ${formatMoney(amount / POINTS_PER_GHS)}`}
        </Button>
      </div>

      {amount > totalPoints && <p className="mt-2 text-xs text-danger">You only have {totalPoints} points.</p>}
    </div>
  );
}

export function LoyaltyTab() {
  const { account, history } = useLoyalty();

  if (account.isPending) {
    return (
      <div className="space-y-5" aria-busy="true">
        <div className="h-36 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
      </div>
    );
  }

  if (account.isError) {
    return <QueryError error={account.error} onRetry={() => account.refetch()} title="We couldn’t load your rewards" />;
  }

  const data = account.data;
  if (!data) return null;

  const { benefits } = data;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Award className="size-4" aria-hidden />
            Points balance
          </div>
          <Badge tone="accent">{TIER_LABEL[data.tier] ?? data.tier}</Badge>
        </div>

        <p className="mt-2 text-4xl font-semibold tabular-nums">{data.totalPoints.toLocaleString()}</p>
        <p className="mt-1 text-sm text-muted">Worth {formatMoney(data.pointsValue)}</p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Tier progress</span>
            <span className="tabular-nums">{Math.round(data.tierProgressPercent)}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${data.tierProgressPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">Lifetime spend {formatMoney(data.lifetimeSpend)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <Gift className="size-4 text-accent" aria-hidden />
          <p className="mt-2 text-sm font-semibold">{benefits.discountPercent}% off</p>
          <p className="text-xs text-muted">On your tier</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <Award className="size-4 text-accent" aria-hidden />
          <p className="mt-2 text-sm font-semibold">{benefits.pointsMultiplier}× points</p>
          <p className="text-xs text-muted">On every order</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <Truck className="size-4 text-accent" aria-hidden />
          <p className="mt-2 text-sm font-semibold">
            {benefits.freeShippingThreshold > 0 ? `Over ${formatMoney(benefits.freeShippingThreshold)}` : "Not yet"}
          </p>
          <p className="text-xs text-muted">Free delivery</p>
        </div>
      </div>

      <RedeemForm totalPoints={data.totalPoints} />

      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Points history</h2>
        {history.isPending ? (
          <div className="mt-4 space-y-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-surface-muted" />
            ))}
          </div>
        ) : (history.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Award className="size-6 text-muted" aria-hidden />}
            iconBadge
            title="No points yet"
            description="You'll earn points on every order you place."
            className="mt-2"
          />
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {(history.data ?? []).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{tx.reason}</p>
                  <p className="text-xs text-muted">{formatDateTime(tx.createdAt)}</p>
                </div>
                <span className={cn("shrink-0 font-medium tabular-nums", tx.points >= 0 ? "text-success" : "text-muted")}>
                  {tx.points >= 0 ? "+" : "−"}
                  {Math.abs(tx.points).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
