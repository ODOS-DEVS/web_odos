"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_KEY } from "@/libs/theme";

export type Theme = "light" | "dark";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getSnapshot = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const getServerSnapshot = (): Theme => "light";

/** Current theme (read from <html data-theme>) plus a setter that persists the choice. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    // Ease the brightness change instead of jumping (see .theme-transition in globals.css).
    root.classList.add("theme-transition");
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this visit.
    }
    window.setTimeout(() => root.classList.remove("theme-transition"), 250);
  }, []);

  return { theme, setTheme };
}
