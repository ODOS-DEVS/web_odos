import { VOUCHERS_ENDPOINTS } from "@/libs/api-endpoint";
import type { StoreVoucherRead, VoucherWalletRead } from "@/types/api";
import type { Voucher } from "@/types/catalog";
import type { SavedVoucher } from "@/types/voucher";
import { apiFetch } from "./http";
import { toVoucher } from "./mappers";

/** One cart line as the promotion endpoints expect it. */
export type PromotionItemInput = {
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type VoucherPreviewInput = {
  voucher_code: string;
  items: PromotionItemInput[];
  shipping_amount?: number;
};

/** What a voucher is worth against a specific cart, straight from `POST /vouchers/preview`. */
export type VoucherPreview = {
  voucher_id: string;
  code: string;
  title: string;
  reward_text: string;
  discount_amount: number;
  subtotal_amount: number;
  shipping_amount: number;
  total_amount: number;
};

/** A claimed voucher keeps the wallet's own `status` ("active", "used", "expired"). */
function toSavedVoucher(v: VoucherWalletRead): SavedVoucher & { status: string } {
  return {
    id: v.id,
    code: v.code,
    label: v.title,
    rewardText: v.reward_text,
    minSpend: v.min_subtotal,
    expiresAt: v.expires_at ?? null,
    status: v.status,
  };
}

export const vouchersService = {
  /** Public: every offer currently on the board. */
  async promotions(): Promise<Voucher[]> {
    const rows = await apiFetch<StoreVoucherRead[]>(VOUCHERS_ENDPOINTS.promotions);
    return rows.map(toVoucher);
  },

  /** Public: the offers a single vendor is running. */
  async forStore(storeId: string): Promise<Voucher[]> {
    const rows = await apiFetch<StoreVoucherRead[]>(VOUCHERS_ENDPOINTS.forStore(storeId));
    return rows.map(toVoucher);
  },

  /** The shopper's own wallet of claimed vouchers. */
  async mine() {
    const rows = await apiFetch<VoucherWalletRead[]>(VOUCHERS_ENDPOINTS.mine, { revalidate: false });
    return rows.map(toSavedVoucher);
  },

  /** Moves a public offer into the shopper's wallet. */
  claim: (voucherId: string) => apiFetch<void>(VOUCHERS_ENDPOINTS.claim(voucherId), { method: "POST" }),

  /** Checks a code against a cart before checkout, so the shopper sees the discount first. */
  preview: (input: VoucherPreviewInput) =>
    apiFetch<VoucherPreview>(VOUCHERS_ENDPOINTS.preview, { method: "POST", body: input }),
};
