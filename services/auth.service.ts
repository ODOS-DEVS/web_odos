import { AUTH_ENDPOINTS, IDENTITY_ENDPOINTS } from "@/libs/api-endpoint";
import type {
  AuthToken,
  MessageResponse,
  PasswordResetTokenResponse,
  UserCreate,
  UserRead,
  UserUpdate,
  VerifiedPhonesResponse,
} from "@/types/api";
import { apiFetch } from "./http";

export const authService = {
  /** The spec omits the body, but the API accepts JSON `{email, password}` (what the mobile app sends). */
  login: (input: { email: string; password: string }) =>
    apiFetch<AuthToken>(AUTH_ENDPOINTS.login, { method: "POST", body: input }),

  signup: (input: UserCreate) => apiFetch<UserRead>(AUTH_ENDPOINTS.signup, { method: "POST", body: input }),

  logout: () => apiFetch<unknown>(AUTH_ENDPOINTS.logout, { method: "POST" }),

  me: () => apiFetch<UserRead>(IDENTITY_ENDPOINTS.me, { revalidate: false }),

  updateMe: (input: UserUpdate) => apiFetch<UserRead>(IDENTITY_ENDPOINTS.me, { method: "PATCH", body: input }),

  verifyEmail: (code: string) =>
    apiFetch<UserRead>(IDENTITY_ENDPOINTS.verifyEmail, { method: "POST", body: { code } }),

  resendVerificationCode: () => apiFetch<MessageResponse>(IDENTITY_ENDPOINTS.resendVerificationCode, { method: "POST" }),

  forgotPassword: (email: string) =>
    apiFetch<MessageResponse>(AUTH_ENDPOINTS.forgotPassword, { method: "POST", body: { email } }),

  /** Step 2 of password recovery: trade the emailed code for a reset token. */
  verifyResetCode: (email: string, code: string) =>
    apiFetch<PasswordResetTokenResponse>(AUTH_ENDPOINTS.verifyResetCode, { method: "POST", body: { email, code } }),

  /** Step 3: set the new password with the token from step 2. */
  resetPassword: (input: { email: string; resetToken: string; newPassword: string }) =>
    apiFetch<MessageResponse>(AUTH_ENDPOINTS.resetPassword, {
      method: "POST",
      body: { email: input.email, reset_token: input.resetToken, new_password: input.newPassword },
    }),

  /** Exchanges a Google Identity Services ID token for an ODOS session. */
  google: (idToken: string) => apiFetch<AuthToken>(AUTH_ENDPOINTS.google, { method: "POST", body: { id_token: idToken } }),

  /** Texts a code to the number. `link_to_profile` makes the verified number the account's phone. */
  sendPhoneCode: (phoneNumber: string, linkToProfile: boolean = true) =>
    apiFetch<MessageResponse>(IDENTITY_ENDPOINTS.phoneSendCode, {
      method: "POST",
      body: { phone_number: phoneNumber, link_to_profile: linkToProfile },
    }),

  verifyPhone: (phoneNumber: string, code: string, linkToProfile: boolean = true) =>
    apiFetch<UserRead>(IDENTITY_ENDPOINTS.phoneVerify, {
      method: "POST",
      body: { phone_number: phoneNumber, code, link_to_profile: linkToProfile },
    }),

  verifiedPhones: () => apiFetch<VerifiedPhonesResponse>(IDENTITY_ENDPOINTS.phoneVerified, { revalidate: false }),
};
