"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * A single search-param synced with state, so an open detail view (a return request, an address
 * form, a chat thread…) survives a refresh or a shared link instead of silently collapsing back to
 * the list. Mirrors the account tab switcher's own URL-sync pattern. Replaces history, no scroll jump.
 */
export function useQueryParam(key: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key);
  const setValue = (next: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === null) params.delete(key);
    else params.set(key, next);
    router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  return [value, setValue] as const;
}
