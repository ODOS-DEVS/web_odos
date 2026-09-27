import { AUTH_ENDPOINTS, IDENTITY_ENDPOINTS } from "@/libs/api-endpoint";
import type { AuthToken, MessageResponse, UserCreate, UserRead, UserUpdate } from "@/types/api";
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
};
