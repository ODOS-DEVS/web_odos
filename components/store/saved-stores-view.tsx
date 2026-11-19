"use client";

import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { SavedStoreCard } from "@/components/store/saved-store-card";
import { useSession } from "@/hooks/use-auth";
import { useSavedStores, useToggleSavedStore } from "@/hooks/use-saved-stores";

/**
 * Every store this shopper kept.
 *
 * Signed out is its own state, not an empty list: saves live on the account, so telling a guest
 * they have saved nothing would be misleading — they may well have saves on another device.
 */
export function SavedStoresView() {
  const session = useSession();
  const saved = useSavedStores();
  const toggle = useToggleSavedStore();

  if (!session) {
    return (
      <Container className="py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold sm:text-4xl">Saved stores</h1>
        </header>
        <EmptyState
          icon={<Bookmark className="size-10 text-muted" aria-hidden />}
          title="Sign in to see your saved stores"
          description="Saved stores follow your account, so they're waiting on any device you sign in from."
          action={
            <ButtonLink href="/login?next=%2Faccount%2Fsaved-stores" variant="accent">
              Sign in
            </ButtonLink>
          }
        />
      </Container>
    );
  }

  if (saved.isError) {
    return (
      <Container className="py-10">
        <QueryError title="We couldn't load your saved stores" error={saved.error} onRetry={() => saved.refetch()} />
      </Container>
    );
  }

  const rows = saved.data ?? [];

  return (
    <Container className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">Saved stores</h1>
        <p className="mt-2 text-muted">
          {saved.isPending
            ? "Loading your stores…"
            : rows.length === 0
              ? "Stores you save will be waiting here."
              : `${rows.length} store${rows.length === 1 ? "" : "s"} saved to your account`}
        </p>
      </header>

      {saved.isPending ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-52 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-10 text-muted" aria-hidden />}
          title="No saved stores yet"
          description="Find a shop you like and press Save store — it will be here next time, on any device."
          action={
            <ButtonLink href="/stores" variant="accent">
              Browse stores
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <SavedStoreCard
              key={row.store.id}
              store={row.store}
              removing={toggle.isPending}
              onRemove={() =>
                toggle.mutate(
                  { storeId: row.store.id, saved: true },
                  {
                    onSuccess: () => toast.success(`Removed ${row.store.name}`),
                    onError: (error) =>
                      toast.error(error instanceof Error ? error.message : "We couldn't remove that store."),
                  },
                )
              }
            />
          ))}
        </ul>
      )}
    </Container>
  );
}
