"use client";

import type { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { useSession } from "@/hooks/use-auth";

/**
 * Renders `children` only for a logged-in shopper; otherwise a friendly prompt that returns them here
 * after logging in. Shows a skeleton until the client knows whether a session exists (no login flash).
 */
export function RequireLogin({ children, next, message = "Log in to continue." }: { children: ReactNode; next: string; message?: string }) {
  const mounted = useMounted();
  const session = useSession();

  if (!mounted) return <div className="h-72 animate-pulse rounded-3xl bg-surface-muted" aria-busy="true" />;
  if (session) return <>{children}</>;

  const query = `?next=${encodeURIComponent(next)}`;
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-line px-6 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-surface-muted">
        <LockKeyhole className="size-6 text-muted" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-semibold">Log in to continue</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href={`/login${query}`} size="lg">
          Log in
        </ButtonLink>
        <ButtonLink href={`/signup${query}`} size="lg" variant="outline">
          Create an account
        </ButtonLink>
      </div>
    </div>
  );
}
