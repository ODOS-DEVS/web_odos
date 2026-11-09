"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateSessionUser } from "@/libs/auth-session";
import { normalizeGhanaPhone, validateGhanaPhone } from "@/libs/phone";
import { authService } from "@/services/auth.service";
import { queryKeys } from "@/services/queries";
import { useSession } from "./use-auth";

/** The backend expires a code after 10 minutes; this is just the resend cool-off. */
const RESEND_SECONDS = 60;

/**
 * The phone OTP flow, matching the mobile app.
 *
 * `PATCH /auth/me` refuses any phone number that has not been verified, so a number can only reach
 * the profile through here: send a code, enter it, and the verify response comes back as the
 * updated user.
 */
export function usePhoneVerification(rawPhone: string) {
  const session = useSession();
  const queryClient = useQueryClient();
  /** Which number the current code was sent for, so changing the number invalidates it by itself. */
  const [sentFor, setSentFor] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const normalized = useMemo(() => normalizeGhanaPhone(rawPhone), [rawPhone]);
  const validationError = useMemo(() => validateGhanaPhone(rawPhone), [rawPhone]);

  const verifiedPhones = useQuery({
    queryKey: queryKeys.verifiedPhones,
    queryFn: () => authService.verifiedPhones(),
    enabled: Boolean(session),
    staleTime: 60_000,
  });

  const isVerified = useMemo(() => {
    if (!normalized) return false;
    return (verifiedPhones.data ?? []).some((phone) => normalizeGhanaPhone(phone) === normalized);
  }, [normalized, verifiedPhones.data]);

  // Derived, not reset in an effect: a code only counts for the number it was sent to.
  const codeSent = Boolean(normalized) && sentFor === normalized;
  const canResendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    if (resendAt <= now) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [resendAt, now]);

  const sendCode = useMutation({
    mutationFn: () => {
      if (!normalized) throw new Error(validationError ?? "Enter a valid Ghana phone number.");
      return authService.sendPhoneCode(normalized);
    },
    onSuccess: () => {
      setSentFor(normalized);
      setNow(Date.now());
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
    },
  });

  const verify = useMutation({
    mutationFn: (code: string) => {
      if (!normalized) throw new Error(validationError ?? "Enter a valid Ghana phone number.");
      return authService.verifyPhone(normalized, code);
    },
    onSuccess: (user) => {
      // The verify response is the updated account, so the stored session moves with it.
      updateSessionUser(user);
      queryClient.setQueryData(queryKeys.me, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.verifiedPhones });
      setSentFor(null);
      setResendAt(0);
    },
  });

  return {
    normalized,
    validationError,
    isVerified,
    codeSent,
    canResendIn,
    sendCode,
    verify,
  };
}
