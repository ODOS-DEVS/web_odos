"use client";

import { AwardPointsForm } from "@/components/account/award-points-form";
import { useState } from "react";
import { toast } from "sonner";
import { Award, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoyalty } from "@/hooks/use-loyalty";
import { formatDateTime, formatMoney } from "@/libs/format";
import { cn } from "@/libs/cn";

const REDEEM_OPTIONS = [
  { points: 100, off: 10 },
  { points: 200, off: 20 },
  { points: 300, off: 30 },
] as const;

export function LoyaltySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading loyalty points">
      {/* Membership Card Skeleton */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-7 animate-pulse">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="size-11 shrink-0 rounded-xl bg-surface-muted" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-24 rounded-md bg-surface-muted" />
                <div className="h-5 w-14 rounded-full bg-surface-muted" />
              </div>
              <div className="h-3.5 w-48 rounded-md bg-surface-muted" />
            </div>
          </div>
          <div className="flex flex-col sm:items-end border-t border-line/60 pt-4 sm:border-0 sm:pt-0 space-y-1.5">
            <div className="h-3 w-28 rounded-md bg-surface-muted" />
            <div className="h-8 w-20 rounded-md bg-surface-muted" />
            <div className="h-3 w-32 rounded-md bg-surface-muted" />
          </div>
        </div>
        <div className="mt-6 border-t border-line/60 pt-4 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-28 rounded bg-surface-muted" />
            <div className="h-3 w-24 rounded bg-surface-muted" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-muted" />
        </div>
      </section>

      {/* Redeem Vouchers Skeleton */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-7 animate-pulse space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="size-5 rounded bg-surface-muted" />
            <div className="h-5 w-44 rounded-md bg-surface-muted" />
          </div>
          <div className="h-3.5 w-72 rounded-md bg-surface-muted" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-xl border border-line bg-surface/50 p-4 space-y-3">
              <div className="h-4 w-20 rounded bg-surface-muted" />
              <div className="h-6 w-28 rounded-md bg-surface-muted" />
              <div className="h-3 w-24 rounded bg-surface-muted" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-line/60 pt-4">
          <div className="h-4 w-48 rounded-md bg-surface-muted" />
          <div className="h-10 w-40 rounded-full bg-surface-muted" />
        </div>
      </section>

      {/* Points Activity Skeleton */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-7 animate-pulse space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="size-5 rounded bg-surface-muted" />
          <div className="h-5 w-32 rounded-md bg-surface-muted" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between py-3.5">
              <div className="space-y-1.5">
                <div className="h-4 w-40 rounded-md bg-surface-muted" />
                <div className="h-3 w-28 rounded-md bg-surface-muted" />
              </div>
              <div className="h-4 w-16 rounded-md bg-surface-muted" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function LoyaltyTab() {
  const { account, history, redeemAsync, isRedeeming, isLoading } = useLoyalty();
  const [selectedPoints, setSelectedPoints] = useState<number>(100);

  const pointsBalance =
    typeof account?.points_balance === "number" && !isNaN(account.points_balance)
      ? account.points_balance
      : 0;
  const lifetimePoints =
    typeof account?.lifetime_points === "number" && !isNaN(account.lifetime_points)
      ? account.lifetime_points
      : 0;
  const pointRate =
    typeof account?.point_cedi_value === "number" && !isNaN(account.point_cedi_value)
      ? account.point_cedi_value
      : 0.1;
  const cediValue = pointsBalance * pointRate;
  const tierName = account?.tier_name?.trim() || "Member";

  const safeHistory = Array.isArray(history) ? history : [];

  const onRedeem = async () => {
    if (pointsBalance < selectedPoints) {
      toast.error("You need more points to redeem this discount");
      return;
    }
    try {
      const res = await redeemAsync(selectedPoints);
      toast.success(
        res?.discount_code
          ? `Voucher ready: use ${res.discount_code} for ${formatMoney(res.amount_off ?? selectedPoints * pointRate)} off at checkout.`
          : `Successfully redeemed ${selectedPoints} points!`
      );
    } catch {
      toast.error("Failed to redeem points");
    }
  };

  if (isLoading) {
    return <LoyaltySkeleton />;
  }

  const selectedDiscount = selectedPoints * pointRate;
  const canAffordSelected = pointsBalance >= selectedPoints;

  return (
    <div className="space-y-6">
      {/* Membership Status Card */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-foreground">
              <Award className="size-5.5" aria-hidden />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">{tierName}</h2>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                  Active
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {account?.tier_multiplier
                  ? `${account.tier_multiplier}x points on all marketplace purchases`
                  : "Earn points on every completed order"}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end border-t border-line/60 pt-4 sm:border-0 sm:pt-0">
            <span className="text-xs uppercase tracking-wider text-muted font-medium">Available balance</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
                {pointsBalance}
              </span>
              <span className="text-sm font-medium text-muted">pts</span>
            </div>
            <span className="text-xs text-muted mt-0.5">
              Worth ≈ <strong className="font-medium text-foreground">{formatMoney(cediValue)}</strong>
            </span>
          </div>
        </div>

        {account?.points_to_next_tier && account?.next_tier_name && (
          <div className="mt-5 border-t border-line/60 pt-4">
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span>
                Next tier: <strong className="text-foreground">{account.next_tier_name}</strong>
              </span>
              <span>{account.points_to_next_tier} points to unlock</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full bg-foreground transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, ((lifetimePoints % 500) / 500) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Redeem Vouchers Section */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Redeem for discounts</h3>
            <p className="mt-0.5 text-xs text-muted">
              Convert your points into immediate checkout discount codes.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {REDEEM_OPTIONS.map((option) => {
            const isSelected = selectedPoints === option.points;
            const canAfford = pointsBalance >= option.points;

            return (
              <button
                key={option.points}
                type="button"
                onClick={() => setSelectedPoints(option.points)}
                className={cn(
                  "press relative flex flex-col justify-between rounded-xl border p-4.5 text-left transition-all",
                  isSelected
                    ? "border-accent bg-accent/5 ring-1 ring-accent"
                    : "border-line bg-surface hover:border-foreground/30",
                  !canAfford && "opacity-65",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted uppercase tracking-wide">
                      {option.points} points
                    </span>
                    {isSelected && (
                      <span className="grid size-4.5 place-items-center rounded-full bg-accent text-accent-foreground">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="mt-2.5 text-2xl font-bold tracking-tight text-foreground">
                    {formatMoney(option.off)} OFF
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      canAfford ? "text-success" : "text-muted",
                    )}
                  >
                    {canAfford ? "Available to redeem" : "Needs more points"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-line/60 pt-5">
          <p className="text-xs text-muted">
            Redeeming <strong className="text-foreground">{selectedPoints} points</strong> applies a{" "}
            <strong className="text-foreground">{formatMoney(selectedDiscount)}</strong> discount code
            to your account.
          </p>

          <Button
            type="button"
            variant="accent"
            onClick={onRedeem}
            disabled={isRedeeming || !canAffordSelected}
            className="w-full sm:w-auto"
          >
            {isRedeeming ? "Redeeming…" : "Redeem voucher"}
          </Button>
        </div>
      </section>

      {/* Points Ledger / Activity */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
        <h3 className="text-base font-semibold text-foreground">Points Activity</h3>
        <p className="mt-0.5 text-xs text-muted">
          Your ledger of points earned from purchases and spent on discounts.
        </p>

        <div className="mt-4 divide-y divide-line">
          {safeHistory.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">
              No points activity yet. You automatically receive points whenever an order is completed.
            </p>
          ) : (
            safeHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{entry.reason}</p>
                  <p className="text-xs text-muted mt-0.5">{formatDateTime(entry.created_at)}</p>
                </div>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    entry.points > 0 ? "text-success" : "text-muted",
                  )}
                >
                  {entry.points > 0 ? `+${entry.points}` : entry.points} pts
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <AwardPointsForm />
    </div>
  );
}
