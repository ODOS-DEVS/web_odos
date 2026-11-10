/**
 * Remembers a payment the shopper left the site to complete.
 *
 * KutanaPay has no return-URL field -- its create-checkout call accepts a
 * customer, an amount and metadata, and nothing that says where to send the
 * payer afterwards. So the provider cannot bring anyone back, and the only
 * party that can is us.
 *
 * The happy path keeps a tab open on the result page, which polls. This stash
 * covers the rest: a blocked popup, a closed tab, a handset that switched to
 * the mobile money app and never came back. Whenever the shopper next opens
 * the site we can see there is a payment outstanding and take them to it.
 */
const KEY = "odos:pending-payment";

/** Long enough to cover a slow mobile money approval, short enough that a long-abandoned
 *  checkout does not greet someone days later. KutanaPay checkouts expire well inside this. */
const TTL_MS = 30 * 60 * 1000;

/**
 * Which endpoint settles this reference. An order reference sent to the wallet's
 * verify route is simply not found, so the two cannot be confused.
 */
export type PendingPaymentKind = "order" | "topup";

export type PendingPayment = { reference: string; kind: PendingPaymentKind; at: number };

/** Same-tab subscribers. The `storage` event only fires in *other* tabs, so local
 *  writes have to announce themselves. */
const listeners = new Set<() => void>();

function announce() {
  for (const listener of listeners) listener();
}

/**
 * Subscribe to the stash, for `useSyncExternalStore`.
 *
 * Covers both directions: `storage` catches the tab next door settling the
 * payment, and `announce` catches writes in this one.
 */
export function subscribePendingPayment(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// `useSyncExternalStore` compares snapshots by identity and re-renders until it
// sees a stable one, so parsing afresh each call would loop forever. Keyed on
// the raw string, which is what actually changes.
let cachedRaw: string | null = null;
let cachedValue: PendingPayment | null = null;

/** Snapshot for `useSyncExternalStore`. Returns the same object until the stored value changes. */
export function pendingPaymentSnapshot(): PendingPayment | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = readPendingPayment();
  }
  return cachedValue;
}

/** Server render has no localStorage, and nothing pending to show. */
export function pendingPaymentServerSnapshot(): PendingPayment | null {
  return null;
}

export function rememberPendingPayment(reference: string, kind: PendingPaymentKind) {
  if (typeof window === "undefined" || !reference) return;
  try {
    // One slot: a shopper cannot be at two hosted checkouts at once, and if
    // they somehow are, the one they are looking at now is the live one.
    window.localStorage.setItem(KEY, JSON.stringify({ reference, kind, at: Date.now() }));
    announce();
  } catch {
    // A private-mode or quota-full localStorage must not take the checkout down
    // with it -- losing the stash only costs the shopper a manual trip back.
  }
}

export function readPendingPayment(): PendingPayment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingPayment>;
    if (
      typeof parsed?.reference !== "string" ||
      typeof parsed?.at !== "number" ||
      (parsed?.kind !== "order" && parsed?.kind !== "topup")
    ) {
      forgetPendingPayment();
      return null;
    }
    if (Date.now() - parsed.at > TTL_MS) {
      forgetPendingPayment();
      return null;
    }
    return { reference: parsed.reference, kind: parsed.kind, at: parsed.at };
  } catch {
    forgetPendingPayment();
    return null;
  }
}

export function forgetPendingPayment() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    announce();
  } catch {
    // Nothing to do: see rememberPendingPayment.
  }
}
