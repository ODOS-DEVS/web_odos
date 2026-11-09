import { ACCOUNT_ENDPOINTS } from "@/libs/api-endpoint";
import { apiFetch } from "./http";

export type DeletionEligibilityRead = {
  eligible: boolean;
  reason?: string | null;
  pending_orders_count?: number;
  wallet_balance?: number;
};

export type EmailPreferencesRead = {
  order_updates: boolean;
  newsletter: boolean;
  promotions: boolean;
  vendor_updates: boolean;
};

export const accountSecurityService = {
  /** Checks whether the account has open orders, active disputes, or non-zero wallet balance preventing deletion. */
  checkDeletionEligibility: () =>
    apiFetch<DeletionEligibilityRead>(ACCOUNT_ENDPOINTS.deletionEligibility, { revalidate: false }),

  /** Permanently deletes the signed-in user's account and personal records. */
  deleteAccount: () =>
    apiFetch<{ message: string }>(ACCOUNT_ENDPOINTS.account, { method: "DELETE" }),

  /** Reads the user's email notification preferences. */
  getEmailPreferences: () =>
    apiFetch<EmailPreferencesRead>(ACCOUNT_ENDPOINTS.emailPreferences, { revalidate: false }),

  /** Updates email notification preferences. */
  updateEmailPreferences: (input: Partial<EmailPreferencesRead>) =>
    apiFetch<EmailPreferencesRead>(ACCOUNT_ENDPOINTS.emailPreferences, {
      method: "PATCH",
      body: input,
    }),
};

