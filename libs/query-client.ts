import { QueryClient, isServer } from "@tanstack/react-query";
import { ApiError } from "@/services/http";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data prefetched on the server is fresh for a minute, so hydration doesn't refetch immediately.
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        // Don't hammer the API on client errors (404, 401, 422…); retry transient failures twice.
        retry: (failureCount, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

/** Browser: one shared client for the whole session. Server: a fresh client per call. */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  return (browserClient ??= makeQueryClient());
}
