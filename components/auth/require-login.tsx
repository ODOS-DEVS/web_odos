"use client";

import type { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
    <EmptyState
      icon={<LockKeyhole className="size-6 text-muted" aria-hidden />}
      iconBadge
      title="Log in to continue"
      description={message}
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/login${query}`} size="lg">
            Log in
          </ButtonLink>
          <ButtonLink href={`/signup${query}`} size="lg" variant="outline">
            Create an account
          </ButtonLink>
        </div>
      }
    />
  );
}
