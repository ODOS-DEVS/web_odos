export const STORAGE_ROOT_KEY = "odos";


const UNSAFE_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

type Tree = Record<string, unknown>;

function isTree(value: unknown): value is Tree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSegments(path: string): string[] {
  const segments = path.split(".");
  if (segments.some((segment) => segment === "" || UNSAFE_SEGMENTS.has(segment))) {
    throw new Error(`Invalid storage path: "${path}"`);
  }
  return segments;
}

function getIn(tree: Tree, segments: string[]): unknown {
  let node: unknown = tree;
  for (const segment of segments) {
    if (!isTree(node)) return undefined;
    node = node[segment];
  }
  return node;
}

function setIn(tree: Tree, segments: string[], value: unknown): void {
  let node = tree;
  segments.slice(0, -1).forEach((segment) => {
    const child = node[segment];
    if (isTree(child)) {
      node = child;
    } else {
      const created: Tree = {};
      node[segment] = created;
      node = created;
    }
  });
  node[segments[segments.length - 1]] = value;
}

/** Deletes the leaf, then prunes any parent object it leaves empty. */
function removeIn(tree: Tree, segments: string[]): void {
  const [head, ...rest] = segments;
  if (rest.length === 0) {
    delete tree[head];
    return;
  }
  const child = tree[head];
  if (!isTree(child)) return;
  removeIn(child, rest);
  if (Object.keys(child).length === 0) delete tree[head];
}

function readRoot(): Tree {
  const raw = window.localStorage.getItem(STORAGE_ROOT_KEY);
  if (raw === null) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isTree(parsed)) return {};

    // A previous sidebar implementation accidentally used "sidebar.collapsed"
    // as a path inside the shared object. Move that value to the canonical UI
    // path so the pre-hydration hint and the reactive hook agree after reload.
    const misplacedCollapsed = getIn(parsed, ["sidebar", "collapsed"]);
    if (
      typeof misplacedCollapsed === "boolean" &&
      getIn(parsed, ["ui", "sidebar_collapsed"]) === undefined
    ) {
      setIn(parsed, ["ui", "sidebar_collapsed"], misplacedCollapsed);
      removeIn(parsed, ["sidebar", "collapsed"]);
      writeRoot(parsed);
    }

    return parsed;
  } catch {
    // A corrupted entry reads as empty, so the next write replaces it
    // instead of failing forever.
    return {};
  }
}

function writeRoot(tree: Tree): void {
  if (Object.keys(tree).length === 0) {
    window.localStorage.removeItem(STORAGE_ROOT_KEY);
  } else {
    window.localStorage.setItem(STORAGE_ROOT_KEY, JSON.stringify(tree));
  }
}


/**
 * Generic, synchronous localStorage access — no callbacks, since
 * `localStorage` itself is synchronous. Non-component code (the axios
 * interceptor, the auth store's init) uses these functions directly; a
 * component that wants reactive updates uses `hooks/use-local-storage.ts`
 * instead, built on top of these same functions.
 *
 * Every call reads the object fresh from storage rather than caching it, so a
 * write from another tab is never overwritten with a stale copy.
 */

export function getItem<T = string>(path: string): T | null {
  if (typeof window === "undefined") return null;
  const segments = toSegments(path);
  try {
    const value = getIn(readRoot(), segments);
    return value === undefined ? null : (value as T);
  } catch {
    return null;
  }
}

export function setItem<T>(path: string, value: T): void {
  if (typeof window === "undefined") return;
  const segments = toSegments(path);
  try {
    const tree = readRoot();
    setIn(tree, segments, value);
    writeRoot(tree);
  } catch {
    // Storage can fail (private browsing, quota, disabled) — a failed write
    // is treated the same as "no value", not a crash. See architecture.md's
    // "graceful degradation" rule.
  }
}

export function removeItem(path: string): void {
  if (typeof window === "undefined") return;
  const segments = toSegments(path);
  try {
    const tree = readRoot();
    removeIn(tree, segments);
    writeRoot(tree);
  } catch {
    // See setItem.
  }
}
