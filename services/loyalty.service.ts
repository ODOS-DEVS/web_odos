import { LOYALTY_ENDPOINTS } from "@/libs/api-endpoint";
import type {
  LoyaltyAccountRead,
  LoyaltyHistoryEntryRead,
  LoyaltyRedeemInput,
  LoyaltyRedeemRead,
} from "@/types/api";
import { apiFetch } from "./http";

export const loyaltyService = {
  account: () => apiFetch<LoyaltyAccountRead>(LOYALTY_ENDPOINTS.account, { revalidate: false }),

  history: async (): Promise<LoyaltyHistoryEntryRead[]> => {
    try {
      const res = await apiFetch<unknown>(LOYALTY_ENDPOINTS.history, { revalidate: false });
      if (Array.isArray(res)) return res;
      if (res && typeof res === "object") {
        const obj = res as Record<string, unknown>;
        if (Array.isArray(obj.history)) return obj.history as LoyaltyHistoryEntryRead[];
        if (Array.isArray(obj.items)) return obj.items as LoyaltyHistoryEntryRead[];
        if (Array.isArray(obj.data)) return obj.data as LoyaltyHistoryEntryRead[];
        if (Array.isArray(obj.results)) return obj.results as LoyaltyHistoryEntryRead[];
        if (Array.isArray(obj.entries)) return obj.entries as LoyaltyHistoryEntryRead[];
      }
      return [];
    } catch {
      return [];
    }
  },

  redeem: (input: LoyaltyRedeemInput) =>
    apiFetch<LoyaltyRedeemRead>(LOYALTY_ENDPOINTS.redeem, {
      method: "POST",
      body: input,
    }),

  /** Admin only: award bonus points to a customer (POST /loyalty/admin/award, all query params). */
  awardBonus: (input: { userId: string; points: number; reason: string }) =>
    apiFetch<unknown>(LOYALTY_ENDPOINTS.awardBonus, {
      method: "POST",
      query: { user_id: input.userId.trim(), points: Math.round(input.points), reason: input.reason.trim() },
    }),
};
