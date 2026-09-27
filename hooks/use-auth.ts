"use client";

import { useSyncExternalStore } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearSession, getSession, setSession, subscribeSession } from "@/libs/auth-session";
import { authService } from "@/services/auth.service";
import { queryKeys } from "@/services/queries";
import type { UserCreate } from "@/types/api";

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
