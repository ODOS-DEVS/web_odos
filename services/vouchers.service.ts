import { VOUCHERS_ENDPOINTS } from "@/libs/api-endpoint";
import type { StoreVoucherRead, VoucherWalletRead } from "@/types/api";
import type { SavedVoucher, StoreVoucher } from "@/types/voucher";
import { apiFetch } from "./http";

const toStoreVoucher = (v: StoreVoucherRead): StoreVoucher => ({
  id: v.id,
  code: v.code,
  title: v.title,
  description: v.description?.trim() || null,
  rewardText: v.reward_text,
  minSubtotal: v.min_subtotal,
  expiresAt: v.expires_at ?? null,
  claimed: Boolean(v.claimed),
  issuer: v.issuer_name ?? v.store_name ?? null,
  autoApply: v.availability === "auto",
});

export const toSavedVoucher = (v: VoucherWalletRead): SavedVoucher => {
  const match = v.reward_text?.match(/(\d+)/);
  const amountOff = match ? Number(match[1]) : 20;

  return {
    id: v.id,
    code: v.code,
    label: v.title || v.reward_text || "Voucher",
    amountOff,
    minSpend: v.min_subtotal ?? 0,
    expiresAt: v.expires_at ?? new Date(Date.now() + 30 * 86_400_000).toISOString(),
  };
};

export const vouchersService = {
  /** Platform-wide ODOS promotions (GET /vouchers/promotions). Public. */
  async promotions(): Promise<StoreVoucher[]> {
    const rows = await apiFetch<StoreVoucherRead[]>(VOUCHERS_ENDPOINTS.promotions, { revalidate: 60 });
    return rows.map(toStoreVoucher).sort((a, b) => a.minSubtotal - b.minSubtotal);
  },

  /** Public, but `claimed` is only accurate when the request carries the shopper's token. */
  async forStore(storeId: string): Promise<StoreVoucher[]> {
    const rows = await apiFetch<StoreVoucherRead[]>(VOUCHERS_ENDPOINTS.forStore(storeId), { revalidate: false });
    return rows.map(toStoreVoucher);
  },

  /** Lists the signed-in shopper's saved / claimed vouchers in their wallet. */
  async mine(): Promise<SavedVoucher[]> {
    const rows = await apiFetch<VoucherWalletRead[]>(VOUCHERS_ENDPOINTS.mine, { revalidate: false });
    return rows.map(toSavedVoucher);
  },

  /** Adds the voucher to the signed-in shopper's wallet. */
  claim: (voucherId: string) => apiFetch<VoucherWalletRead>(VOUCHERS_ENDPOINTS.claim(voucherId), { method: "POST" }),

  /** Redeems a code by claiming it into the shopper's wallet. */
  async redeemCode(code: string): Promise<SavedVoucher> {
    // If preview endpoint is available, preview and claim; otherwise claim directly with code payload
    const result = await apiFetch<VoucherWalletRead>(VOUCHERS_ENDPOINTS.preview, {
      method: "POST",
      body: { code },
    });
    return toSavedVoucher(result);
  },
};
