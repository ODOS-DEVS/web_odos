"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/libs/cn";

/**
 * One-tap light/dark switch. Both icons are always rendered and swapped with the
 * `dark:` variant, so the correct icon shows on first paint (no hydration flash).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn("press grid size-9 place-items-center rounded-full hover:bg-surface-muted min-[320px]:size-10", className)}
    >
      <Sun className="hidden size-4.5 min-[320px]:size-5 dark:block" aria-hidden />
      <Moon className="size-4.5 min-[320px]:size-5 dark:hidden" aria-hidden />
    </button>
  );
}
