"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/hooks/use-theme";

/** Sonner follows the site's theme attribute rather than only the OS setting. */
export function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-center"
      theme={theme}
    />
  );
}
