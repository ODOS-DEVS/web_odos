import { AUTH_ENDPOINTS, IDENTITY_ENDPOINTS } from "@/libs/api-endpoint";
import type { AuthToken, MessageResponse, UserCreate, UserRead, UserUpdate } from "@/types/api";
import { apiFetch } from "./http";

export const authService = {
  /** The spec omits the body, but the API accepts JSON `{email, password}` (what the mobile app sends). */
  login: (input: { email: string; password: string }) =>
    apiFetch<AuthToken>(AUTH_ENDPOINTS.login, { method: "POST", body: input }),

  signup: (input: UserCreate) => apiFetch<UserRead>(AUTH_ENDPOINTS.signup, { method: "POST", body: input }),

  /** Exchanges a Google `id_token` for an ODOS session. Unauthenticated: no bearer is attached. */
  google: (idToken: string, pictureUrl?: string | null) =>
    apiFetch<AuthToken>(AUTH_ENDPOINTS.google, {
      method: "POST",
      body: { id_token: idToken, picture_url: pictureUrl ?? null },
    }),

  logout: () => apiFetch<unknown>(AUTH_ENDPOINTS.logout, { method: "POST" }),

  me: () => apiFetch<UserRead>(IDENTITY_ENDPOINTS.me, { revalidate: false }),

  updateMe: (input: UserUpdate) => apiFetch<UserRead>(IDENTITY_ENDPOINTS.me, { method: "PATCH", body: input }),

  /**
   * Sends a 6-digit OTP. `link_to_profile` tells the backend this number is meant to become the
   * account's phone, which is what later lets `PATCH /auth/me` accept it.
   */
  sendPhoneCode: (phoneNumber: string, linkToProfile = true) =>
    apiFetch<MessageResponse>(IDENTITY_ENDPOINTS.phoneSendCode, {
      method: "POST",
      body: { phone_number: phoneNumber, link_to_profile: linkToProfile },
    }),

  /** Returns the updated user: on success the backend has set `phone_number` and `phone_verified`. */
  verifyPhone: (phoneNumber: string, code: string, linkToProfile = true) =>
    apiFetch<UserRead>(IDENTITY_ENDPOINTS.phoneVerify, {
      method: "POST",
      body: { phone_number: phoneNumber, code, link_to_profile: linkToProfile },
    }),

  /** Every number this account has proven it controls. */
  async verifiedPhones(): Promise<string[]> {
    const result = await apiFetch<{ phones: string[] }>(IDENTITY_ENDPOINTS.phoneVerified, { revalidate: false });
    return result.phones ?? [];
  },

  verifyEmail: (code: string) =>
    apiFetch<UserRead>(IDENTITY_ENDPOINTS.verifyEmail, { method: "POST", body: { code } }),

  resendVerificationCode: () => apiFetch<MessageResponse>(IDENTITY_ENDPOINTS.resendVerificationCode, { method: "POST" }),

  forgotPassword: (email: string) =>
    apiFetch<MessageResponse>(AUTH_ENDPOINTS.forgotPassword, { method: "POST", body: { email } }),
};
