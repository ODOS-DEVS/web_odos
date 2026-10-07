/** A redeemable voucher sitting in the shopper's own wallet — distinct from `catalog.Voucher`, which is a per-store offer still up for grabs. */
export type SavedVoucher = {
  id: string;
  code: string;
  label: string;
  amountOff: number;
  minSpend: number;
  expiresAt: string;
};
