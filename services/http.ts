import Axios, { normalizeError } from "@/utils/axios";

/** Error thrown for any failed request, carrying the backend's `detail` message. `status` 0 = no response. */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type Primitive = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, Primitive>;
  /** JSON body. */
  body?: unknown;
  /**
   * Attach the bearer token when logged in (default true). Endpoints in `UNAUTHENTICATED_ENDPOINTS`
   * (login, signup, password recovery) never get one; set false to force it off for any other call.
   */
  auth?: boolean;
  signal?: AbortSignal;
  /** Server-side cache lifetime in seconds for GETs (default 60); `false` disables caching. */
  revalidate?: number | false;
};

/** Drops empty values so `?q=` never reaches the backend. */
function cleanQuery(query?: RequestOptions["query"]) {
  const entries = Object.entries(query ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return entries.length ? Object.fromEntries(entries) : undefined;
}

/** Turns whatever axios threw into `ApiError`. Cancellations pass through untouched (TanStack Query relies on that). */
function toApiError(error: unknown): unknown {
  const normalized = normalizeError(error);
  switch (normalized.type) {
    case "cancel":
      return error;
    case "http":
      return new ApiError(normalized.status, normalized.message, normalized.detail);
    case "network":
      return new ApiError(0, normalized.message);
    case "unknown":
      return normalized.error;
  }
}

/**
 * The single call every service makes: typed request and response over the shared axios instance
 * (`utils/axios.ts`), with the backend's errors turned into `ApiError`. Works on the server and in the browser.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, auth = true, signal, revalidate = 60 } = options;

  // On the server axios runs on `fetch`, so Next's data cache honours these options.
  const cacheOptions =
    typeof window === "undefined" && method === "GET"
      ? { fetchOptions: (revalidate === false ? { cache: "no-store" } : { next: { revalidate } }) as RequestInit }
      : {};

  try {
    const response = await Axios.request<T>({
      url: path,
      method,
      params: cleanQuery(query),
      data: body,
      signal,
      skipAuth: !auth,
      ...cacheOptions,
    });
    // An empty body (204, or `null`) arrives as "" — callers expect `undefined`.
    return (response.data === ("" as unknown) ? undefined : response.data) as T;
  } catch (error) {
    throw toApiError(error);
  }
}
