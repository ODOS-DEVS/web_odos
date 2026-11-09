"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGoogleLogin } from "@/hooks/use-auth";
import CONFIG from "@/utils/config";

type GoogleCredentialResponse = { credential: string };
type GoogleId = {
  initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? Object.assign(document.createElement("script"), { src: SCRIPT_SRC, async: true, defer: true });
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Google sign-in failed to load")), { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-3a7.2 7.2 0 0 1-10.7-3.78H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.35 14.31a7.2 7.2 0 0 1 0-4.62v-3.1H1.4a12 12 0 0 0 0 10.82l3.95-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.59l3.95 3.1A7.15 7.15 0 0 1 12 4.75Z" />
    </svg>
  );
}

/**
 * "Continue with Google": Google Identity Services gives us an ID token, which POST /auth/google turns
 * into an ODOS session. Needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; without it the button says so instead.
 */
export function GoogleButton({ onSignedIn }: { onSignedIn: (firstName: string) => void }) {
  const google = useGoogleLogin();
  const slot = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  // Latest callbacks without re-initialising Google on every render.
  const handlers = useRef({ google, onSignedIn });
  useEffect(() => {
    handlers.current = { google, onSignedIn };
  });

  useEffect(() => {
    if (!CONFIG.GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !slot.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CONFIG.GOOGLE_CLIENT_ID,
          callback: ({ credential }) =>
            handlers.current.google.mutate(credential, {
              onSuccess: ({ user }) => handlers.current.onSignedIn(user.full_name.split(" ")[0] ?? ""),
              onError: (error) => toast.error(error.message),
            }),
        });
        window.google.accounts.id.renderButton(slot.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: slot.current.offsetWidth || 320,
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!CONFIG.GOOGLE_CLIENT_ID || failed) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="mt-8 w-full"
        onClick={() => toast.info("Google sign-in isn’t available on the website yet")}
      >
        <GoogleMark />
        Continue with Google
      </Button>
    );
  }

  return (
    <div className="mt-8">
      <div ref={slot} className="flex min-h-11 w-full justify-center" aria-busy={google.isPending} />
      {google.isPending && <p className="mt-2 text-center text-xs text-muted">Signing you in…</p>}
    </div>
  );
}
