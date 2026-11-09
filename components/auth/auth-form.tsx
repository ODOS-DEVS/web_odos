"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { useLogin, useSignup } from "@/hooks/use-auth";
import { GoogleButton } from "./google-button";
import { ApiError } from "@/services/http";

/** Log in / sign up against the real API. `next` is a same-site path to return to afterwards. */
export function AuthForm({ mode, next = "/" }: { mode: "login" | "signup"; next?: string }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const login = useLogin();
  const signup = useSignup();
  const mutation = isLogin ? login : signup;

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const done = {
      onSuccess: (result: { user: { full_name: string; is_verified: boolean } }) => {
        toast.success(isLogin ? `Welcome back, ${result.user.full_name.split(" ")[0]}` : "Your account is ready");
        // New accounts get an emailed code; confirm it straight away, then carry on to `next`.
        router.replace(!isLogin && !result.user.is_verified ? `/verify-email?next=${encodeURIComponent(next)}` : next);
        router.refresh();
      },
    };

    if (isLogin) login.mutate({ email: email.trim(), password }, done);
    else signup.mutate({ full_name: name.trim(), email: email.trim(), password, phone_number: phone.trim() || null }, done);
  };

  const error = mutation.error;
  const message = error instanceof ApiError ? error.message : error ? "Something went wrong. Please try again." : null;
  const suffix = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-3xl font-semibold">{isLogin ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-sm text-muted">
        {isLogin ? "Log in to track orders and check out faster." : "Shop many vendors and check out once."}
      </p>

      <GoogleButton
        onSignedIn={(firstName) => {
          toast.success(firstName ? `Welcome, ${firstName}` : "You’re logged in");
          router.replace(next);
          router.refresh();
        }}
      />

      <div className="my-6 flex items-center gap-3 text-xs text-muted" role="separator">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {!isLogin && <Field id="name" label="Full name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />}
        <Field id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {!isLogin && (
          <Field id="phone" label="Phone number" hint="Optional" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        )}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            {isLogin && (
              <Link href={`/forgot-password${suffix}`} className="text-xs text-muted underline underline-offset-2 hover:text-foreground">
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? undefined : 8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="press absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
          {!isLogin && <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>}
        </div>

        {message && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {message}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? (isLogin ? "Logging in…" : "Creating account…") : isLogin ? "Log in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isLogin ? "New to ODOS? " : "Already have an account? "}
        <Link href={`${isLogin ? "/signup" : "/login"}${suffix}`} className="font-medium text-foreground underline underline-offset-2">
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </div>
  );
}
