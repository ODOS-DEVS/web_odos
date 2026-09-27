"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import CONFIG from "@/utils/config";

/** Sonner follows the site's theme attribute rather than only the OS setting. */
export function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      // In development the React Query devtools button sits bottom-right; keep toasts clear of it.
      offset={CONFIG.IS_PROD ? undefined : { bottom: 72, right: 24 }}
      mobileOffset={CONFIG.IS_PROD ? undefined : { bottom: 72 }}
    />
  );
}
