"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { usePhoneVerification } from "@/hooks/use-phone-verification";
import { cn } from "@/libs/cn";
import { formatPhoneInput } from "@/libs/phone";
import { ApiError } from "@/services/http";

const message = (error: unknown, fallback: string) =>
  error instanceof ApiError || error instanceof Error ? error.message : fallback;

/**
 * Phone number plus its one-time-code check.
 *
 * The account's phone can only be set by verifying it — `PATCH /auth/me` rejects an unverified
 * number outright — so this owns the field rather than the surrounding profile form.
 */
export function PhoneVerification({ phone, onPhoneChange }: { phone: string; onPhoneChange: (phone: string) => void }) {
  const { validationError, isVerified, codeSent, canResendIn, sendCode, verify } = usePhoneVerification(phone);
  const [code, setCode] = useState("");

  const onSend = () =>
    sendCode.mutate(undefined, {
      onSuccess: (result) => toast.success(result?.message || "We sent you a verification code"),
      onError: (error) => toast.error(message(error, "We couldn't send the code. Please try again.")),
    });

  const onVerify = () =>
    verify.mutate(code, {
      onSuccess: () => {
        setCode("");
        toast.success("Phone number verified and saved");
      },
      onError: (error) => toast.error(message(error, "We couldn't verify that code.")),
    });

  return (
    <div className="sm:col-span-2">
      <Field
        id="phone"
        label="Phone number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="0541234567"
        value={phone}
        // Ghana local format, matching the mobile app: digits only, 10 max.
        onChange={(e) => onPhoneChange(formatPhoneInput(e.target.value))}
        error={validationError ?? undefined}
      />

      {isVerified ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
          <BadgeCheck className="size-3.5" aria-hidden />
          Verified — saved to your profile
        </p>
      ) : (
        <div className="mt-3 rounded-2xl border border-line bg-surface-muted p-4">
          <p className="flex items-start gap-2 text-xs text-muted">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>A phone number has to be verified before it can be saved to your profile.</span>
          </p>

          {!codeSent ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={onSend}
              disabled={!phone.trim() || Boolean(validationError) || sendCode.isPending}
            >
              {sendCode.isPending ? "Sending…" : "Send verification code"}
            </Button>
          ) : (
            <div className="mt-3">
              <label htmlFor="phone-code" className="mb-1.5 block text-sm font-medium">
                Enter the 6-digit code
              </label>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  id="phone-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={cn(inputClass, "tracking-[0.3em] sm:flex-1")}
                />
                <Button
                  type="button"
                  variant="accent"
                  onClick={onVerify}
                  disabled={code.length !== 6 || verify.isPending}
                  className="sm:w-auto"
                >
                  {verify.isPending ? "Verifying…" : "Verify"}
                </Button>
              </div>
              <button
                type="button"
                onClick={onSend}
                disabled={canResendIn > 0 || sendCode.isPending}
                className="press mt-2 text-xs font-medium text-accent hover:opacity-80 disabled:text-muted disabled:hover:opacity-100"
              >
                {canResendIn > 0 ? `Resend in ${canResendIn}s` : "Resend code"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
