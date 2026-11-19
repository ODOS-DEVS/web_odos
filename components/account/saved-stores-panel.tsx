"use client";

import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { SavedStoreCard } from "@/components/store/saved-store-card";
import { useSavedStores, useToggleSavedStore } from "@/hooks/use-saved-stores";

/**
 * Saved stores inside the account tabs.
 *
 * The same list as `/account/saved-stores`, which is the shareable page; this is the copy that
 * lives in the tab strip so the feature is reachable from account navigation without a detour.
 * Both read one query, so switching between them costs nothing.
 */
export function SavedStoresPanel() {
  const saved = useSavedStores();
  const toggle = useToggleSavedStore();

  if (saved.isError) {
    return <QueryError title="We couldn't load your saved stores" error={saved.error} onRetry={() => saved.refetch()} />;
  }

  if (saved.isPending) {
    return (
      <ul className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <li key={i} className="h-52 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
        ))}
      </ul>
    );
  }

  const rows = saved.data ?? [];
  if (rows.length === 0) {
    return (
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
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
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
  );
}
