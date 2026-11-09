/** Points earn and burn at 100 points = GH₵1, and redemption must be a whole number of cedis. */
export const POINTS_PER_GHS = 100;

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export type LoyaltyBenefits = {
  discountPercent: number;
  pointsMultiplier: number;
  freeShippingThreshold: number;
  birthdayBonus: number;
};

export type LoyaltyAccount = {
  totalPoints: number;
  tier: LoyaltyTier;
  /** 0–100 toward the next tier; 100 once on the top tier. */
  tierProgressPercent: number;
  lifetimeSpend: number;
  /** What the balance is worth in cedis, as the backend values it. */
  pointsValue: number;
  benefits: LoyaltyBenefits;
};

export type LoyaltyTransaction = {
  id: string;
  /** Free text on the wire ("earned", "redeemed", "bonus"…). */
  type: string;
  /** Signed: positive when earned, negative when spent. */
  points: number;
  reason: string;
  createdAt: string;
};

/** Redemption moves real money into the ODOS wallet rather than discounting a cart. */
export type LoyaltyRedemption = {
  success: boolean;
  message: string;
  pointsRedeemed?: number;
  cashValue?: number;
  walletBalance?: number;
};
