import type { UserRead } from "@/types/api";

/**
 * Client-side session (access token + user). The backend has NO refresh token: when the token expires
 * the shopper logs in again. Stored in localStorage — readable by any XSS on this origin, so keep it
 * short-lived; move to an httpOnly cookie via a small BFF if that trade-off is not acceptable.
 */
export type Session = { token: string; expiresAt: number; user: UserRead };

const STORAGE_KEY = "odos-session";
const listeners = new Set<() => void>();

// `undefined` = not read yet. A stable object identity is required by useSyncExternalStore.
let cached: Session | null | undefined;

function read(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  if (cached === undefined) cached = read();
  // An expired token is treated as logged out even if it is still in storage.
  if (cached && cached.expiresAt <= Date.now()) cached = null;
  return cached;
}

export function getAccessToken() {
  return getSession()?.token ?? null;
}

export function setSession(token: string, expiresInSeconds: number, user: UserRead) {
  cached = { token, expiresAt: Date.now() + expiresInSeconds * 1000, user };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Storage can be blocked (private mode); the session then lasts until reload.
  }
  emit();
}

export function updateSessionUser(user: UserRead) {
  const session = getSession();
  if (session) setSession(session.token, Math.max((session.expiresAt - Date.now()) / 1000, 1), user);
}

export function clearSession() {
  cached = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cached = undefined; // another tab logged in/out
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
