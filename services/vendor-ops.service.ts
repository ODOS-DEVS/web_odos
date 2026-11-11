import { VENDOR_ENDPOINTS } from "@/libs/api-endpoint";
import type {
  VendorInventoryMovement,
  VendorPayoutDetailsInput,
  VendorPayoutInstitution,
  VendorProductPerformance,
  VendorReturn,
  VendorReview,
  VendorVoucher,
  VendorVoucherInput,
  VendorWallet,
} from "@/types/vendor";
import { apiFetch } from "./http";

/* ---------- Wire shapes (snake_case, straight from the API) ---------- */

type VendorReturnRead = {
  id: string;
  order_id: string;
  order_number: string;
  product_id: string;
  product_title: string;
  product_image_url?: string | null;
  customer_name?: string | null;
  request_type: string;
  status: string;
  quantity: number;
  reason: string;
  details?: string | null;
  evidence_image_urls?: string[] | null;
  admin_note?: string | null;
  refund_amount?: number | null;
  created_at: string;
  updated_at: string;
};

type VendorReviewRead = {
  id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string | null;
  rating: number;
  comment: string;
  customer_name?: string | null;
  is_hidden?: boolean;
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
  created_at: string;
};

type VendorVoucherRead = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  issuer_name?: string | null;
  availability: string;
  reward_text: string;
  discount_type: string;
  discount_value: number;
  min_subtotal: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  per_user_limit?: number | null;
  is_active: boolean;
  status: string;
  redemption_count: number;
  unique_user_count: number;
  total_discount_amount: number;
  starts_at?: string | null;
  ends_at?: string | null;
  approval_status?: string;
  review_notes?: string | null;
  created_at: string;
};

type VendorWalletTransactionRead = {
  id: string;
  kind: string;
  title: string;
  amount: number;
  gross_amount?: number | null;
  commission_amount?: number | null;
  balance_after: number;
  created_at: string;
};

type VendorWithdrawalRead = {
  id: string;
  status: string;
  amount: number;
  note?: string | null;
  admin_note?: string | null;
  payout_method_type: string;
  payout_account_name: string;
  payout_account_number_masked: string;
  payout_provider?: string | null;
  transfer_failure_reason?: string | null;
  created_at: string;
};

type VendorWalletRead = {
  currency: string;
  available_balance: number;
  pending_withdrawal_balance: number;
  lifetime_earnings: number;
  total_withdrawn: number;
  total_commission: number;
  commission_rate: number;
  payout_method_type?: string | null;
  payout_account_name?: string | null;
  payout_account_number_masked?: string | null;
  payout_provider?: string | null;
  recent_transactions: VendorWalletTransactionRead[];
  withdrawal_requests: VendorWithdrawalRead[];
};

type VendorPayoutInstitutionRead = {
  code: string;
  name: string;
  payout_method_type: string;
  currency: string;
};

type VendorProductPerformanceRead = {
  product_id: string;
  units_sold: number;
  gross_sales: number;
  order_count: number;
  last_sold_at?: string | null;
};

type VendorInventoryFeedRead = {
  id: string;
  product_id: string;
  product_title: string;
  delta: number;
  stock_after: number;
  reason: string;
  note?: string | null;
  created_at: string;
};

/* ---------- Mappers ---------- */

function toReturn(r: VendorReturnRead): VendorReturn {
  return {
    id: r.id,
    orderId: r.order_id,
    orderNumber: r.order_number,
    productId: r.product_id,
    productTitle: r.product_title,
    productImageUrl: r.product_image_url ?? null,
    customerName: r.customer_name ?? "ODOS customer",
    requestType: r.request_type,
    status: r.status,
    quantity: r.quantity,
    reason: r.reason,
    details: r.details ?? null,
    evidenceImageUrls: r.evidence_image_urls ?? [],
    adminNote: r.admin_note ?? null,
    refundAmount: r.refund_amount ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toReview(r: VendorReviewRead): VendorReview {
  return {
    id: r.id,
    productId: r.product_id,
    productTitle: r.product_title,
    productImageUrl: r.product_image_url ?? null,
    rating: r.rating,
    comment: r.comment,
    customerName: r.customer_name ?? "ODOS customer",
    isHidden: Boolean(r.is_hidden),
    vendorReply: r.vendor_reply ?? null,
    vendorRepliedAt: r.vendor_replied_at ?? null,
    createdAt: r.created_at,
  };
}

function toVoucher(v: VendorVoucherRead): VendorVoucher {
  return {
    id: v.id,
    code: v.code,
    title: v.title,
    description: v.description ?? null,
    issuerName: v.issuer_name ?? null,
    availability: v.availability,
    rewardText: v.reward_text,
    discountType: v.discount_type,
    discountValue: v.discount_value,
    minSubtotal: v.min_subtotal,
    maxDiscount: v.max_discount ?? null,
    usageLimit: v.usage_limit ?? null,
    perUserLimit: v.per_user_limit ?? null,
    isActive: v.is_active,
    status: v.status,
    redemptionCount: v.redemption_count,
    uniqueUserCount: v.unique_user_count,
    totalDiscountAmount: v.total_discount_amount,
    startsAt: v.starts_at ?? null,
    endsAt: v.ends_at ?? null,
    approvalStatus: v.approval_status ?? "approved",
    reviewNotes: v.review_notes ?? null,
    createdAt: v.created_at,
  };
}

function toWallet(w: VendorWalletRead): VendorWallet {
  return {
    currency: w.currency,
    availableBalance: w.available_balance,
    pendingWithdrawalBalance: w.pending_withdrawal_balance,
    lifetimeEarnings: w.lifetime_earnings,
    totalWithdrawn: w.total_withdrawn,
    totalCommission: w.total_commission,
    commissionRate: w.commission_rate,
    payoutMethodType: w.payout_method_type ?? null,
    payoutAccountName: w.payout_account_name ?? null,
    payoutAccountNumberMasked: w.payout_account_number_masked ?? null,
    payoutProvider: w.payout_provider ?? null,
    recentTransactions: w.recent_transactions.map((t) => ({
      id: t.id,
      kind: t.kind,
      title: t.title,
      amount: t.amount,
      grossAmount: t.gross_amount ?? null,
      commissionAmount: t.commission_amount ?? null,
      balanceAfter: t.balance_after,
      createdAt: t.created_at,
    })),
    withdrawalRequests: w.withdrawal_requests.map((req) => ({
      id: req.id,
      status: req.status,
      amount: req.amount,
      note: req.note ?? null,
      adminNote: req.admin_note ?? null,
      payoutMethodType: req.payout_method_type,
      payoutAccountName: req.payout_account_name,
      payoutAccountNumberMasked: req.payout_account_number_masked,
      payoutProvider: req.payout_provider ?? null,
      transferFailureReason: req.transfer_failure_reason ?? null,
      createdAt: req.created_at,
    })),
  };
}

function voucherToWire(input: VendorVoucherInput) {
  return {
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    description: input.description?.trim() || null,
    availability: input.availability,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    min_subtotal: input.minSubtotal,
    max_discount: input.maxDiscount,
    usage_limit: input.usageLimit,
    per_user_limit: input.perUserLimit,
    is_active: input.isActive,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
  };
}

/* ---------- Service ---------- */

export const vendorOpsService = {
  /* -- Returns -- */

  async returns(): Promise<VendorReturn[]> {
    const rows = await apiFetch<VendorReturnRead[]>(VENDOR_ENDPOINTS.returns, { revalidate: false });
    return rows.map(toReturn).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  async updateReturn(id: string, input: { status: string; note?: string }): Promise<VendorReturn> {
    return toReturn(
      await apiFetch<VendorReturnRead>(VENDOR_ENDPOINTS.return(id), {
        method: "PATCH",
        body: { status: input.status, vendor_note: input.note?.trim() || null },
        revalidate: false,
      }),
    );
  },

  /* -- Reviews -- */

  async reviews(): Promise<VendorReview[]> {
    const rows = await apiFetch<VendorReviewRead[]>(VENDOR_ENDPOINTS.reviews, { revalidate: false });
    return rows.map(toReview).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  async replyToReview(reviewId: string, reply: string): Promise<VendorReview> {
    return toReview(
      await apiFetch<VendorReviewRead>(VENDOR_ENDPOINTS.reviewReply(reviewId), {
        method: "PATCH",
        body: { reply: reply.trim() },
        revalidate: false,
      }),
    );
  },

  /* -- Vouchers -- */

  async vouchers(): Promise<VendorVoucher[]> {
    const rows = await apiFetch<VendorVoucherRead[]>(VENDOR_ENDPOINTS.vouchers, { revalidate: false });
    return rows.map(toVoucher).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  async createVoucher(input: VendorVoucherInput): Promise<VendorVoucher> {
    return toVoucher(
      await apiFetch<VendorVoucherRead>(VENDOR_ENDPOINTS.vouchers, {
        method: "POST",
        body: voucherToWire(input),
        revalidate: false,
      }),
    );
  },

  /** Whole-record write: the API's PATCH takes the full upsert payload, so every field goes back. */
  async updateVoucher(id: string, input: VendorVoucherInput): Promise<VendorVoucher> {
    return toVoucher(
      await apiFetch<VendorVoucherRead>(VENDOR_ENDPOINTS.voucher(id), {
        method: "PATCH",
        body: voucherToWire(input),
        revalidate: false,
      }),
    );
  },

  async giftVoucher(id: string, recipientEmail: string, note?: string): Promise<VendorVoucher> {
    return toVoucher(
      await apiFetch<VendorVoucherRead>(VENDOR_ENDPOINTS.voucherGift(id), {
        method: "POST",
        body: { recipient_email: recipientEmail.trim().toLowerCase(), note: note?.trim() || null },
        revalidate: false,
      }),
    );
  },

  deleteVoucher(id: string) {
    return apiFetch<unknown>(VENDOR_ENDPOINTS.voucher(id), { method: "DELETE", revalidate: false });
  },

  /* -- Wallet -- */

  async wallet(): Promise<VendorWallet> {
    return toWallet(await apiFetch<VendorWalletRead>(VENDOR_ENDPOINTS.wallet, { revalidate: false }));
  },

  async payoutInstitutions(methodType: string): Promise<VendorPayoutInstitution[]> {
    const rows = await apiFetch<VendorPayoutInstitutionRead[]>(VENDOR_ENDPOINTS.walletInstitutions(methodType), {
      revalidate: false,
    });
    return rows.map((i) => ({ code: i.code, name: i.name, payoutMethodType: i.payout_method_type, currency: i.currency }));
  },

  async savePayoutDetails(input: VendorPayoutDetailsInput): Promise<VendorWallet> {
    return toWallet(
      await apiFetch<VendorWalletRead>(VENDOR_ENDPOINTS.walletPayoutDetails, {
        method: "PATCH",
        body: {
          payout_method_type: input.payoutMethodType,
          payout_account_name: input.payoutAccountName.trim(),
          payout_account_number: input.payoutAccountNumber.trim(),
          payout_provider: input.payoutProvider.trim(),
        },
        revalidate: false,
      }),
    );
  },

  /** ODOS reviews each request; the money leaves `available` into `pending` until then. */
  requestWithdrawal(amount: number, note?: string) {
    return apiFetch<unknown>(VENDOR_ENDPOINTS.walletWithdrawals, {
      method: "POST",
      body: { amount, note: note?.trim() || null },
      revalidate: false,
    });
  },

  /* -- Stock context -- */

  async productPerformance(days = 30): Promise<Map<string, VendorProductPerformance>> {
    const rows = await apiFetch<VendorProductPerformanceRead[]>(VENDOR_ENDPOINTS.productsPerformance(days), {
      revalidate: false,
    });
    return new Map(
      rows.map((r) => [
        r.product_id,
        {
          productId: r.product_id,
          unitsSold: r.units_sold,
          grossSales: r.gross_sales,
          orderCount: r.order_count,
          lastSoldAt: r.last_sold_at ?? null,
        },
      ]),
    );
  },

  async inventoryMovements(limit = 40): Promise<VendorInventoryMovement[]> {
    const rows = await apiFetch<VendorInventoryFeedRead[]>(VENDOR_ENDPOINTS.inventoryMovements(limit), {
      revalidate: false,
    });
    return rows.map((m) => ({
      id: m.id,
      productId: m.product_id,
      productTitle: m.product_title,
      delta: m.delta,
      stockAfter: m.stock_after,
      reason: m.reason,
      note: m.note ?? null,
      createdAt: m.created_at,
    }));
  },
};
