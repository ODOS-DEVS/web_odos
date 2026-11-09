"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useForgotPassword, useResetPassword, useVerifyResetCode } from "@/hooks/use-auth";
import { CodeField, FormError } from "./code-field";

type Step = "email" | "code" | "password";

const errorText = (error: Error | null) => error?.message ?? null;

/** Password recovery in three steps: email → emailed code → new password. Then back to log in. */
export function ForgotPasswordForm({ next = "/" }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");

  const requestCode = useForgotPassword();
  const verifyCode = useVerifyResetCode();
  const reset = useResetPassword();
  const loginHref = `/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;

  const onEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestCode.mutate(email.trim(), {
      onSuccess: () => {
        setStep("code");
        toast.success("If that email has an account, we’ve sent it a code");
      },
    });
  };

  const onCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verifyCode.mutate(
      { email: email.trim(), code },
      {
        onSuccess: ({ reset_token }) => {
          setResetToken(reset_token);
          setStep("password");
        },
      },
    );
  };

  const onPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset.mutate(
      { email: email.trim(), resetToken, newPassword: password },
      {
        onSuccess: () => {
          toast.success("Password updated — log in with your new password");
          router.replace(loginHref);
        },
      },
    );
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">
        {step === "email" && "Enter your account email and we’ll send you a code."}
        {step === "code" && `Enter the code we sent to ${email}. It expires in 10 minutes.`}
        {step === "password" && "Choose a new password for your account."}
      </p>

      {step === "email" && (
        <form onSubmit={onEmail} className="mt-8 space-y-4">
          <Field id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormError message={errorText(requestCode.error)} />
          <Button type="submit" size="lg" className="w-full" disabled={requestCode.isPending}>
            {requestCode.isPending ? "Sending…" : "Send code"}
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={onCode} className="mt-8 space-y-4">
          <CodeField value={code} onChange={setCode} />
          <FormError message={errorText(verifyCode.error)} />
          <Button type="submit" size="lg" className="w-full" disabled={verifyCode.isPending || code.length < 6}>
            {verifyCode.isPending ? "Checking…" : "Continue"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-muted underline underline-offset-2 hover:text-foreground disabled:opacity-50"
            disabled={requestCode.isPending}
            onClick={() => requestCode.mutate(email.trim(), { onSuccess: () => toast.success("New code sent") })}
          >
            Send a new code
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={onPassword} className="mt-8 space-y-4">
          <Field
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="-mt-2 text-xs text-muted">At least 8 characters.</p>
          <FormError message={errorText(reset.error)} />
          <Button type="submit" size="lg" className="w-full" disabled={reset.isPending}>
            {reset.isPending ? "Saving…" : "Set new password"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href={loginHref} className="font-medium text-foreground underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}
