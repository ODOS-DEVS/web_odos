/**
 * Temporary stand-in for a resolved `useQuery` result, so components written against TanStack Query's
 * shape (`.data`/`.isPending`/`.isError`/`.error`/`.refetch()`) don't need to change while they're fed
 * dummy data instead of a real network call. Delete this whole `mocks/` folder once the backend is wired.
 */
export function fakeQuery<T, E extends boolean = false>(
  data: T,
  opts: { isPending?: boolean; isError?: E; error?: unknown } = {},
): { data: T; isPending: boolean; isFetching: boolean; isError: E; error: unknown; isSuccess: boolean; refetch: () => void } {
  const isPending = opts.isPending ?? false;
  const isError = (opts.isError ?? false) as E;
  return {
    data,
    isPending,
    isFetching: isPending,
    isError,
    error: isError ? (opts.error ?? new Error("Mock error")) : null,
    isSuccess: !isPending && !isError,
    refetch: () => {},
  };
}
