"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-auth";
import { useIsStoreSaved, useSavedStores, useToggleSavedStore } from "@/hooks/use-saved-stores";
import { cn } from "@/libs/cn";
import type { Store } from "@/types/catalog";

/**
 * Save a store to the shopper's account.
 *
 * Server-backed, replacing a localStorage list that could not survive logout or reach a second
 * device. A guest is sent to sign in with `?next=` pointing back at the page they were on, so
 * they land where they started rather than on the home page — the save itself is not replayed,
 * because silently acting on a guest's behalf after login is worse than letting them press it
 * again on a page they can see.
 */
export function SaveStoreButton({
  store,
  className,
  size = "sm",
}: {
  store: Store;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const saved = useIsStoreSaved(store.id);
  const { isPending: loading } = useSavedStores();
  const toggle = useToggleSavedStore();

  const onClick = () => {
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    toggle.mutate(
      { storeId: store.id, saved },
      {
        onSuccess: () => toast.success(saved ? `Removed ${store.name}` : `Saved ${store.name}`),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "We couldn't update your saved stores."),
      },
    );
  };

  return (
    <Button
      type="button"
      variant={saved ? "primary" : "outline"}
      size={size}
      aria-pressed={saved}
      // The list is still loading, so "not saved" is not yet known to be true.
      disabled={Boolean(session) && loading}
      onClick={onClick}
      className={cn(className)}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
      {saved ? "Saved" : "Save store"}
    </Button>
  );
}
