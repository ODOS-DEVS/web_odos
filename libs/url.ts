export type SearchParams = Record<string, string | string[] | undefined>;

export function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Builds `/path?a=b` from the current params with `patch` applied (`undefined` removes a key). */
export function buildHref(
  pathname: string,
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Only allow same-site relative redirects (`/orders`), never `//evil.com` or absolute URLs. */
export function safeNext(value: string | undefined, fallback = "/") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
