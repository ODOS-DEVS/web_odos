"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { mockLogin, mockSignup } from "@/mocks/auth.mock";
import { useFakeMutation } from "@/mocks/mutation";
import { ApiError } from "@/services/http";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-3a7.2 7.2 0 0 1-10.7-3.78H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.35 14.31a7.2 7.2 0 0 1 0-4.62v-3.1H1.4a12 12 0 0 0 0 10.82l3.95-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.59l3.95 3.1A7.15 7.15 0 0 1 12 4.75Z" />
    </svg>
  );
}

/** Log in / sign up against the real API. `next` is a same-site path to return to afterwards. */
export function AuthForm({ mode, next = "/" }: { mode: "login" | "signup"; next?: string }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const login = useFakeMutation(mockLogin);
  const signup = useFakeMutation(mockSignup);
  const mutation = isLogin ? login : signup;

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const done = {
      onSuccess: (result: { user: { full_name: string } }) => {
        toast.success(isLogin ? `Welcome back, ${result.user.full_name.split(" ")[0]}` : "Your account is ready");
        router.replace(next);
        router.refresh();
      },
    };

    if (isLogin) login.mutate({ email: email.trim(), password }, done);
    else signup.mutate({ full_name: name.trim(), email: email.trim(), password, phone_number: phone.trim() || undefined }, done);
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

      <Button
        variant="outline"
        size="lg"
        className="mt-8 w-full"
        onClick={() => toast.info("Google sign-in isn’t available on the website yet")}
      >
        <GoogleMark />
        Continue with Google
      </Button>

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
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
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
