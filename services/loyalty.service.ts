import { LOYALTY_ENDPOINTS } from "@/libs/api-endpoint";
import type { LoyaltyAccount, LoyaltyRedemption, LoyaltyTier, LoyaltyTransaction } from "@/types/loyalty";
import { apiFetch } from "./http";

type LoyaltyAccountRead = {
  total_points: number;
  tier_level: string;
  tier_progress_percent: number;
  lifetime_spend: number;
  points_value_ghs: number;
  benefits?: {
    discount_percent?: number;
    points_multiplier?: number;
    free_shipping_threshold?: number;
    birthday_bonus?: number;
  } | null;
};

type LoyaltyTransactionRead = {
  id: string;
  type: string;
  points: number;
  reason: string;
  created_at: string;
};

const TIERS: LoyaltyTier[] = ["bronze", "silver", "gold", "platinum"];
const toTier = (value: string): LoyaltyTier =>
  TIERS.includes(value as LoyaltyTier) ? (value as LoyaltyTier) : "bronze";

function toAccount(a: LoyaltyAccountRead): LoyaltyAccount {
  return {
    totalPoints: a.total_points ?? 0,
    tier: toTier(a.tier_level),
    tierProgressPercent: Math.min(Math.max(a.tier_progress_percent ?? 0, 0), 100),
    lifetimeSpend: a.lifetime_spend ?? 0,
    pointsValue: a.points_value_ghs ?? 0,
    benefits: {
      discountPercent: a.benefits?.discount_percent ?? 0,
      pointsMultiplier: a.benefits?.points_multiplier ?? 1,
      freeShippingThreshold: a.benefits?.free_shipping_threshold ?? 0,
      birthdayBonus: a.benefits?.birthday_bonus ?? 0,
    },
  };
}

export const loyaltyService = {
  async account(): Promise<LoyaltyAccount> {
    return toAccount(await apiFetch<LoyaltyAccountRead>(LOYALTY_ENDPOINTS.account, { revalidate: false }));
  },

  async history(limit = 20): Promise<LoyaltyTransaction[]> {
    const result = await apiFetch<{ transactions?: LoyaltyTransactionRead[] }>(LOYALTY_ENDPOINTS.history, {
      query: { limit },
      revalidate: false,
    });
    return (result.transactions ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      points: t.points,
      reason: t.reason,
      createdAt: t.created_at,
    }));
  },

  /**
   * Burns points for wallet credit. `points` is a query parameter, not a body, and the endpoint
   * answers 200 with `success: false` for a rejected amount rather than an error status — so the
   * caller has to read the flag, not just the status code.
   */
  async redeem(points: number): Promise<LoyaltyRedemption> {
    const result = await apiFetch<{
      success: boolean;
      message?: string;
      points_redeemed?: number;
      cash_value_ghs?: number;
      wallet_balance?: number;
    }>(LOYALTY_ENDPOINTS.redeem, { method: "POST", query: { points } });

    return {
      success: Boolean(result.success),
      message: result.message ?? (result.success ? "Points redeemed." : "We couldn’t redeem those points."),
      pointsRedeemed: result.points_redeemed,
      cashValue: result.cash_value_ghs,
      walletBalance: result.wallet_balance,
    };
  },
};
