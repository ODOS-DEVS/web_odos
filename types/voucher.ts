/** A redeemable voucher sitting in the shopper's own wallet — distinct from `catalog.Voucher`, which is a per-store offer still up for grabs. */
export type SavedVoucher = {
  id: string;
  code: string;
  label: string;
  amountOff: number;
  minSpend: number;
  expiresAt: string;
};

/** A voucher a store is offering on its products, which a signed-in shopper can claim into their wallet. */
export type StoreVoucher = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  /** Ready-made headline from the API, e.g. "GH₵20 off". */
  rewardText: string;
  minSubtotal: number;
  expiresAt: string | null;
  /** Already in the signed-in shopper's wallet. */
  claimed: boolean;
  /** Who funds it ("ODOS" for platform promotions, else the store's name). */
  issuer?: string | null;
  /** `availability: "auto"` — applied at checkout without claiming or typing the code. */
  autoApply?: boolean;
};
