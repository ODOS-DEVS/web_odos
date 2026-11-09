"use client";

import {
  InputOTPAlphanumeric,
  type InputOTPAlphanumericProps,
} from "@/components/ui/input-otp";

export { InputOTPAlphanumeric };

/** A 6-character one-time code input for verification (email, phone and password-reset codes). */
export function CodeField({
  value,
  onChange,
  id = "code",
  label = "Verification code",
  disabled,
  autoFocus = true,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="flex justify-center py-2">
        <InputOTPAlphanumeric
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
}

/** Same error styling as the login form. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}
