"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/cn";
import type { Store } from "@/types/catalog";

/* Brand marks drawn inline: lucide ships no brand icons, and pulling in an icon pack for two
   glyphs is not worth the bytes. */

/** WhatsApp's own mark. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17-.35.22-.65.07a8.2 8.2 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.06c-.17-.3 0-.46.13-.6l.45-.52c.15-.18.2-.3.3-.5s.05-.38-.02-.53-.67-1.6-.92-2.2c-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37s-1.05 1.02-1.05 2.5 1.08 2.9 1.23 3.1 2.12 3.24 5.14 4.54c.72.31 1.28.5 1.71.63.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.42s.25-1.29.18-1.42-.27-.2-.57-.35Z" />
      <path d="M12.04 2A9.9 9.9 0 0 0 2.1 11.9a9.8 9.8 0 0 0 1.33 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01A9.9 9.9 0 0 0 22 11.93 9.9 9.9 0 0 0 12.04 2Zm0 18.12h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.36 8.25 8.25 0 0 1 14.08-5.82 8.2 8.2 0 0 1 2.42 5.83 8.25 8.25 0 0 1-8.25 8.22Z" />
    </svg>
  );
}

/** Facebook's own mark. */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z" />
    </svg>
  );
}

/**
 * Share a store.
 *
 * Uses the platform share sheet where there is one — on a phone that is the only sensible
 * answer, because it reaches every app the person actually has. Desktop browsers mostly do not
 * implement it, so those fall back to an inline row of real destinations plus copy-link.
 *
 * Shares are not counted: the behaviour API's event whitelist has no store-share type and the
 * promo analytics endpoint only accepts campaigns, vouchers and banners, so there is nothing
 * honest to record against. Firing an event the backend rejects would be worse than not
 * counting at all.
 *
 * `navigator.share` and `window.location` are read inside the click handler, never during
 * render or in an effect: neither exists during SSR, and the React compiler rejects both
 * reading impure globals while rendering and setting state from an effect. By the time a
 * click happens both are definitely available.
 */
export function ShareStoreButton({
  store,
  className,
  size = "sm",
}: {
  store: Store;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  //  Set on first interaction, so the fallback links have a real absolute URL to point at.
  const [url, setUrl] = useState("");

  const title = `${store.name} on ODOS`;
  const text = store.description ? `${store.name} — ${store.description}` : title;

  const onShare = async () => {
    const shareUrl = `${window.location.origin}/stores/${store.slug}`;
    setUrl(shareUrl);

    // The platform sheet reaches every app the person actually has, so it wins wherever it
    // exists. Desktop browsers mostly do not implement it; those get the inline list.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // The sheet was dismissed. Not an error, and not worth a toast.
      }
      return;
    }
    setOpen((value) => !value);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url || `${window.location.origin}/stores/${store.slug}`);
      setCopied(true);
      toast.success("Store link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("We couldn't copy the link. Select and copy it manually.");
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Button type="button" variant="outline" size={size} onClick={onShare} aria-expanded={open}>
        <Share2 className="size-4" aria-hidden />
        Share
      </Button>

      {open && (
        <div
          role="group"
          aria-label={`Share ${store.name}`}
          className="absolute top-full right-0 z-20 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-xl"
        >
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface-muted"
          >
            <WhatsAppIcon className="size-4 text-[#25D366]" />
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface-muted"
          >
            <FacebookIcon className="size-4 text-[#1877F2]" />
            Facebook
          </a>
          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-surface-muted"
          >
            {copied ? <Check className="size-4 text-success" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
