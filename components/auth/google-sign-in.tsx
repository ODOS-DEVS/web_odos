"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useGoogleLogin } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/http";
import CONFIG from "@/utils/config";

const GSI_SRC = "https://accounts.google.com/gsi/client";

type CredentialResponse = { credential?: string };

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

/** Loads the Google Identity Services script once per page, shared by every caller. */
let gsiPromise: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  gsiPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google sign-in failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later attempt retry rather than caching the failure forever.
      gsiPromise = null;
      reject(new Error("Google sign-in failed to load"));
    };
    document.head.appendChild(script);
  });

  return gsiPromise;
}

/**
 * "Continue with Google".
 *
 * Google only mints the `id_token` the backend verifies through its own rendered button (the token
 * client issues an access token, which `POST /auth/google` cannot use), so this renders Google's
 * button rather than a look-alike — which is also what Google's branding terms require.
 *
 * With no `NEXT_PUBLIC_GOOGLE_CLIENT_ID` configured the button says so instead of failing on click.
 */
export function GoogleSignIn({ onSuccess }: { onSuccess: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackId = useId();
  const googleLogin = useGoogleLogin();
  const { theme } = useTheme();
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    CONFIG.GOOGLE_CLIENT_ID ? "loading" : "unavailable",
  );

  /**
   * Google's callback is registered once, when its script initialises, so it has to reach the
   * current handler rather than the one that existed at that moment — hence the ref, kept up to
   * date in an effect rather than during render.
   */
  const handlerRef = useRef<(response: CredentialResponse) => void>(() => {});

  useEffect(() => {
    handlerRef.current = (response) => {
      if (!response.credential) {
        toast.error("Google didn’t return a sign-in token. Please try again.");
        return;
      }
      googleLogin.mutate(
        { idToken: response.credential },
        {
          onSuccess,
          onError: (error) =>
            toast.error(error instanceof ApiError ? error.message : "We couldn’t sign you in with Google."),
        },
      );
    };
  }, [googleLogin, onSuccess]);

  useEffect(() => {
    if (!CONFIG.GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGsi()
      .then(() => {
        const id = window.google?.accounts?.id;
        if (cancelled || !id || !containerRef.current) return;

        id.initialize({
          client_id: CONFIG.GOOGLE_CLIENT_ID,
          callback: (response) => handlerRef.current(response),
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        containerRef.current.innerHTML = "";
        id.renderButton(containerRef.current, {
          type: "standard",
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
          width: containerRef.current.offsetWidth || 320,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
    };
    // Re-rendered on theme change so Google's button matches the page.
  }, [theme]);

  if (status === "unavailable") {
    return (
      <p
        id={fallbackId}
        className="mt-8 rounded-2xl border border-line bg-surface-muted px-4 py-3 text-center text-xs text-muted"
      >
        {CONFIG.GOOGLE_CLIENT_ID
          ? "Google sign-in couldn’t load. Check your connection, or use your email and password below."
          : "Google sign-in isn’t configured for this site yet. Use your email and password below."}
      </p>
    );
  }

  return (
    <div className="mt-8">
      {/* Google replaces this with its own button; the height reserves the space so nothing jumps. */}
      <div ref={containerRef} className="flex min-h-11 w-full justify-center [&>div]:w-full" />
      {googleLogin.isPending && <p className="mt-2 text-center text-xs text-muted">Signing you in…</p>}
    </div>
  );
}
