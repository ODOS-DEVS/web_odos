"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearSession, getSession, setSession, subscribeSession, updateSessionUser } from "@/libs/auth-session";
import { authService } from "@/services/auth.service";
import { queryKeys } from "@/services/queries";
import type { UserCreate, UserRead, UserUpdate } from "@/types/api";

/**
 * Current session (or null). `null` on the server and during hydration, then the stored session, so
 * anything gated on it should also handle the not-yet-known state.
 */
export function useSession() {
  return useSyncExternalStore(subscribeSession, getSession, () => null);
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: ({ access_token, expires_in, user }) => {
      setSession(access_token, expires_in, user);
      queryClient.setQueryData(queryKeys.me, user);
    },
  });
}

/** Signup returns the new user without a token, so log in straight away with the same credentials. */
export function useSignup() {
  const login = useLogin();
  return useMutation({
    mutationFn: async (input: UserCreate) => {
      await authService.signup(input);
      return login.mutateAsync({ email: input.email, password: input.password });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await authService.logout();
      } catch {
        // Logging out locally must always work, even if the server call fails.
      }
    },
    onSettled: () => {
      clearSession();
      // Drop every cached private resource (orders, wallet, …) belonging to the previous user.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "catalog" });
    },
  });
}

/**
 * Re-reads the signed-in user from GET /auth/me once per session, so a profile changed on another
 * device (or a role change, e.g. vendor approval) shows up. A 401 here ends the session via the axios
 * interceptor. Mounted once, app-wide, by `AccountSync`.
 */
export function useSessionRefresh() {
  const session = useSession();
  // Keyed by token so a new login always re-reads, even for the same account.
  const me = useQuery({
    queryKey: [...queryKeys.me, session?.token ?? null],
    queryFn: () => authService.me(),
    enabled: Boolean(session),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (me.data && session && me.data.updated_at !== session.user.updated_at) updateSessionUser(me.data);
  }, [me.data, session]);
}

/** Returns the live authenticated user directly from the query cache (GET /auth/me), with fallback to session. */
export function useCurrentUser(): UserRead | null {
  const session = useSession();
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => authService.me(),
    enabled: Boolean(session),
    initialData: session?.user ?? undefined,
    staleTime: 5 * 60_000,
  });
  return query.data ?? session?.user ?? null;
}

/** PATCH /auth/me, then refresh the stored session user so the header and forms update at once. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserUpdate) => authService.updateMe(input),
    onSuccess: (user) => {
      updateSessionUser(user);
      queryClient.setQueryData(queryKeys.me, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

/** Saves the user a verification call returned, so `is_verified` / `phone_verified` update everywhere. */
function useStoreUser() {
  const queryClient = useQueryClient();
  return (user: UserRead) => {
    updateSessionUser(user);
    queryClient.setQueryData(queryKeys.me, user);
  };
}

/** Logs in with a Google ID token (from the Google Identity Services button). */
export function useGoogleLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idToken: string) => authService.google(idToken),
    onSuccess: ({ access_token, expires_in, user }) => {
      setSession(access_token, expires_in, user);
      queryClient.setQueryData(queryKeys.me, user);
    },
  });
}

// Password recovery: email → code → new password. All three calls work without a session.

export const useForgotPassword = () => useMutation({ mutationFn: (email: string) => authService.forgotPassword(email) });

export const useVerifyResetCode = () =>
  useMutation({ mutationFn: (input: { email: string; code: string }) => authService.verifyResetCode(input.email, input.code) });

export const useResetPassword = () =>
  useMutation({
    mutationFn: (input: { email: string; resetToken: string; newPassword: string }) => authService.resetPassword(input),
  });

// Email and phone verification for the signed-in user (codes expire after 10 minutes).

export function useVerifyEmail() {
  const storeUser = useStoreUser();
  return useMutation({ mutationFn: (code: string) => authService.verifyEmail(code), onSuccess: storeUser });
}

export const useResendEmailCode = () => useMutation({ mutationFn: () => authService.resendVerificationCode() });

export const useSendPhoneCode = () => useMutation({ mutationFn: (phone: string) => authService.sendPhoneCode(phone) });

export function useVerifyPhone() {
  const storeUser = useStoreUser();
  return useMutation({
    mutationFn: (input: { phone: string; code: string }) => authService.verifyPhone(input.phone, input.code),
    onSuccess: storeUser,
  });
}
