import "server-only";
import { cache } from "react";
import { dehydrate, type FetchQueryOptions, type QueryClient } from "@tanstack/react-query";
import { makeQueryClient } from "./query-client";

/** One query client per server request, shared by the layout, page and metadata of that request. */
export const getServerQueryClient = cache(makeQueryClient);

/** Serializable cache snapshot for `<HydrationBoundary state={…}>`. */
export const dehydrated = (client: QueryClient) => dehydrate(client);

// Queries differ in data type, so this list is intentionally loosely typed; each factory is typed at its definition.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrefetchOptions = FetchQueryOptions<any, any, any, any>;

/** Prefetch several queries in parallel. Failures are swallowed: the client will retry and show its own error UI. */
export const prefetchAll = (client: QueryClient, ...options: PrefetchOptions[]) =>
  Promise.all(options.map((option) => client.prefetchQuery(option)));
