"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { RequireLogin } from "@/components/auth/require-login";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useResendEmailCode, useSendPhoneCode, useSession, useVerifyEmail, useVerifyPhone } from "@/hooks/use-auth";
import { CodeField, FormError } from "./code-field";

function Done({ title, next }: { title: string; next: string }) {
  return (
    <div className="text-center">
      <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <ButtonLink href={next} size="lg" className="mt-6">
        Continue
      </ButtonLink>
    </div>
  );
}

/** Enter the code emailed at signup (POST /auth/verify-email), or ask for a new one. */
export function VerifyEmailForm({ next = "/" }: { next?: string }) {
  return (
    <div className="w-full max-w-sm">
      <RequireLogin next={`/verify-email?next=${encodeURIComponent(next)}`} message="Log in to verify your email.">
        <VerifyEmailInner next={next} />
      </RequireLogin>
    </div>
  );
}

function VerifyEmailInner({ next }: { next: string }) {
  const router = useRouter();
  const user = useSession()?.user;
  const [code, setCode] = useState("");
  const verify = useVerifyEmail();
  const resend = useResendEmailCode();

  if (user?.is_verified) return <Done title="Your email is verified" next={next} />;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verify.mutate(code, {
      onSuccess: () => {
        toast.success("Email verified");
        router.replace(next);
      },
    });
  };

  return (
    <>
      <h1 className="text-3xl font-semibold">Verify your email</h1>
      <p className="mt-2 text-sm text-muted">
        We sent a code to <span className="font-medium text-foreground">{user?.email}</span>. It expires in 10 minutes.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <CodeField value={code} onChange={setCode} />
        <FormError message={verify.error?.message ?? null} />
        <Button type="submit" size="lg" className="w-full" disabled={verify.isPending || code.length < 6}>
          {verify.isPending ? "Verifying…" : "Verify email"}
        </Button>
      </form>
      <div className="mt-6 flex items-center justify-between text-sm text-muted">
        <button
          type="button"
          className="underline underline-offset-2 hover:text-foreground disabled:opacity-50"
          disabled={resend.isPending}
          onClick={() =>
            resend.mutate(undefined, {
              onSuccess: () => toast.success("New code sent"),
              onError: (error) => toast.error(error.message),
            })
          }
        >
          {resend.isPending ? "Sending…" : "Send a new code"}
        </button>
        <Link href={next} className="underline underline-offset-2 hover:text-foreground">
          Do this later
        </Link>
      </div>
    </>
  );
}

/** Verify a phone number by SMS code and make it the account's number (POST /auth/phone/*). */
export function VerifyPhoneForm({ next = "/account" }: { next?: string }) {
  return (
    <div className="w-full max-w-sm">
      <RequireLogin next={`/verify-phone?next=${encodeURIComponent(next)}`} message="Log in to verify your phone number.">
        <VerifyPhoneInner next={next} />
      </RequireLogin>
    </div>
  );
}

function VerifyPhoneInner({ next }: { next: string }) {
  const router = useRouter();
  const user = useSession()?.user;
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const send = useSendPhoneCode();
  const verify = useVerifyPhone();

  if (user?.phone_verified && !sentTo) return <Done title={`${user.phone_number ?? "Your phone"} is verified`} next={next} />;

  const onSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const number = phone.trim();
    send.mutate(number, {
      onSuccess: () => {
        setSentTo(number);
        toast.success(`Code sent to ${number}`);
      },
    });
  };

  const onVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sentTo) return;
    verify.mutate(
      { phone: sentTo, code },
      {
        onSuccess: () => {
          toast.success("Phone number verified");
          router.replace(next);
        },
      },
    );
  };

  return (
    <>
      <h1 className="text-3xl font-semibold">Verify your phone</h1>
      <p className="mt-2 text-sm text-muted">
        {sentTo ? `Enter the code we texted to ${sentTo}. It expires in 10 minutes.` : "We’ll text you a code to confirm this number is yours."}
      </p>

      {!sentTo ? (
        <form onSubmit={onSend} className="mt-8 space-y-4">
          <Field
            id="phone"
            label="Phone number"
            type="tel"
            autoComplete="tel"
            placeholder="+233 24 123 4567"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <FormError message={send.error?.message ?? null} />
          <Button type="submit" size="lg" className="w-full" disabled={send.isPending}>
            {send.isPending ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={onVerify} className="mt-8 space-y-4">
          <CodeField value={code} onChange={setCode} />
          <FormError message={verify.error?.message ?? null} />
          <Button type="submit" size="lg" className="w-full" disabled={verify.isPending || code.length < 6}>
            {verify.isPending ? "Verifying…" : "Verify phone"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-muted underline underline-offset-2 hover:text-foreground"
            onClick={() => {
              setSentTo(null);
              setCode("");
            }}
          >
            Use a different number
          </button>
        </form>
      )}
    </>
  );
}
