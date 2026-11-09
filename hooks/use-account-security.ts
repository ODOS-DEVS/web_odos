"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  accountSecurityService,
  type EmailPreferencesRead,
} from "@/services/account-security.service";
import { accountQueries, queryKeys } from "@/services/queries";
import { useLogout } from "./use-auth";

export function useEmailPreferences() {
  return useQuery(accountQueries.emailPreferences());
}

export function useUpdateEmailPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<EmailPreferencesRead>) =>
      accountSecurityService.updateEmailPreferences(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.emailPreferences, updated);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update preferences");
    },
  });
}

export function useDeletionEligibility() {
  return useQuery(accountQueries.deletionEligibility());
}

export function useDeleteAccount() {
  const router = useRouter();
  const logout = useLogout();
  return useMutation({
    mutationFn: () => accountSecurityService.deleteAccount(),
    onSuccess: (res) => {
      toast.success(res?.message ?? "Account deleted successfully");
      logout.mutate(undefined, {
        onSettled: () => {
          router.replace("/");
        },
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
    },
  });
}

