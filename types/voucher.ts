/** A voucher sitting in the shopper's own wallet — distinct from `catalog.Voucher`, which is a per-store offer still up for grabs. */
export type SavedVoucher = {
  id: string;
  code: string;
  label: string;
  /** Display-ready reward, e.g. "GH₵10 off" — formatted by the backend. */
  rewardText: string;
  minSpend: number;
  /** Null when the voucher has no expiry. */
  expiresAt: string | null;
  /** "active", "used" or "expired" — decided by the backend. */
  status: string;
};
