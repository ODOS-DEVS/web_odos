"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { getQueryClient } from "@/libs/query-client";
import CONFIG from "@/utils/config";

// Devtools are dev-only and never shipped to production bundles.
const Devtools =
  !CONFIG.IS_PROD
    ? dynamic(() => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools), { ssr: false })
    : () => null;

export function QueryProvider({ children }: { children: ReactNode }) {
  // getQueryClient() is a browser singleton, so React re-renders never recreate the cache.
  const client = getQueryClient();
  return (
    <QueryClientProvider client={client}>
      {children}
      {/* Bottom-right (bottom-left is taken by Next's own dev indicator). */}
      <Devtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
