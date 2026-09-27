"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` during server render and hydration, `true` afterwards. Use it to gate
 * anything that reads browser-only state (e.g. the persisted cart) so the first
 * client render matches the server HTML.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
