import type { Voucher } from "@/types/catalog";
import { MOCK_STORES } from "./catalog.mock";

/** Temporary dummy vouchers standing in for a vouchers endpoint while the backend isn't wired. */

const now = Date.now();
const expiresIn = (days: number, hours = 0) => new Date(now + days * 86_400_000 + hours * 3_600_000).toISOString();

const TEMPLATES: Omit<Voucher, "id" | "storeId">[] = [
  { label: "Test 3", amountOff: 1000, minSpend: 0, expiresAt: expiresIn(14) },
  { label: "Test 3", amountOff: 1000, minSpend: 0, expiresAt: expiresIn(14) },
  { label: "Test 3", amountOff: 1000, minSpend: 0, expiresAt: expiresIn(14) },
];

// Every store gets the same voucher templates for now — enough to make the section worth shipping
// without hand-authoring copy per vendor. Swap for real per-store offers once vouchers are wired.
export const MOCK_VOUCHERS: Voucher[] = MOCK_STORES.flatMap((store) =>
  TEMPLATES.map((template, index) => ({ ...template, id: `voucher-${store.id}-${index}`, storeId: store.id })),
);

export function mockStoreVouchers(storeId: string): Voucher[] {
  return MOCK_VOUCHERS.filter((v) => v.storeId === storeId);
}
