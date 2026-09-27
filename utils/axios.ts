import axios from "axios";
import { ALL_AUTH_ENDPOINTS, UNAUTHENTICATED_ENDPOINTS, apiBaseUrl } from "@/libs/api-endpoint";
import { clearSession, getAccessToken } from "@/libs/auth-session";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Never attach the bearer token to this request (login-style calls). */
    skipAuth?: boolean;
  }
}

/**
 * The one HTTP client for the backend, and the only file that imports axios. `services/http.ts` wraps
 * it (typed errors via `normalizeError` below, query cleanup) and every service goes through that
 * wrapper, so nothing else needs to import axios.
 *
 * - `baseURL`: server render calls the backend origin directly; the browser calls the same-origin
 *   `/api` path that `next.config.ts` proxies, because the backend only allows whitelisted browser
 *   origins (CORS). `apiBaseUrl()` picks the right one from `CONFIG`.
 * - `adapter`: on the server axios uses `fetch`, so Next.js's data cache (`next.revalidate`) applies to
 *   catalogue requests; the browser keeps the default XHR adapter.
 *
 * axios already sets "Content-Type: application/json" on its own whenever the request body is a plain
 * object (every request in this app), so there's no need to declare it as a default here.
 */
const Axios = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 10000,
  adapter: typeof window === "undefined" ? "fetch" : undefined,
});

/**
 * Attach the access token, except on session-creating / recovery endpoints (login, signup, password
 * reset), where a stale token could make the backend reject perfectly valid credentials.
 */
Axios.interceptors.request.use((config) => {
  const skipToken = config.skipAuth || (config.url !== undefined && UNAUTHENTICATED_ENDPOINTS.includes(config.url));
  const token = skipToken ? null : getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

/**
 * There is no refresh endpoint, so a 401 on a request that carried a token means the session is over.
 * Session endpoints (e.g. logout) are excluded: a 401 there must not be mistaken for a fresh expiry.
 */
Axios.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const sentToken = error.config?.headers?.has("Authorization") ?? false;
      const url = error.config?.url ?? "";
      if (sentToken && !ALL_AUTH_ENDPOINTS.includes(url)) clearSession();
    }
    return Promise.reject(error);
  },
);

/** FastAPI returns `{detail: string}` or, for validation errors, `{detail: [{msg, loc}]}`. */
function messageFromDetail(detail: unknown, status: number) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => (typeof d?.msg === "string" ? d.msg : null)).filter(Boolean);
    if (msgs.length) return msgs.join(". ");
  }
  return status >= 500 ? "The server had a problem. Please try again." : `Request failed (${status})`;
}

export type NormalizedAxiosError =
  | { type: "cancel" }
  | { type: "http"; status: number; message: string; detail: unknown }
  | { type: "network"; message: string }
  | { type: "unknown"; error: unknown };

/**
 * Turns anything axios can throw into a plain, axios-free shape. Keeps `axios.isCancel` /
 * `axios.isAxiosError` and the `AxiosError` shape (`error.response`, `error.code`) contained here, so
 * `services/http.ts` can build its `ApiError` without importing axios itself.
 */
export function normalizeError(error: unknown): NormalizedAxiosError {
  if (axios.isCancel(error)) return { type: "cancel" };
  if (!axios.isAxiosError(error)) return { type: "unknown", error };

  if (error.response) {
    const { status, data } = error.response;
    const detail = (data as { detail?: unknown } | undefined)?.detail;
    return { type: "http", status, message: messageFromDetail(detail, status), detail };
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return { type: "network", message: "The server took too long to respond. Please try again." };
  }
  return { type: "network", message: "Can't reach the server. Check your connection and try again." };
}

export { Axios };
export default Axios;
