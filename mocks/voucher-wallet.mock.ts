import type { SavedVoucher } from "@/types/voucher";

/** Temporary dummy data standing in for a shopper vouchers endpoint. Delete along with `mocks/`. */

const now = Date.now();
const expiresIn = (days: number) => new Date(now + days * 86_400_000).toISOString();

export const SEED_SAVED_VOUCHERS: SavedVoucher[] = [
  { id: "sv-welcome", code: "WELCOME10", label: "Welcome offer", amountOff: 20, minSpend: 100, expiresAt: expiresIn(30) },
];

/** Codes a shopper can type into "Redeem a code" — keyed by the uppercased code. */
export const MOCK_REDEEMABLE_CODES: Record<string, Omit<SavedVoucher, "id" | "code">> = {
  ODOS20: { label: "ODOS20 offer", amountOff: 20, minSpend: 150, expiresAt: expiresIn(14) },
  FREESHIP: { label: "Free delivery credit", amountOff: 15, minSpend: 0, expiresAt: expiresIn(10) },
};
