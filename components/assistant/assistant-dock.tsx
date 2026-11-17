"use client";

import { useState } from "react";
import Link from "next/link";
import { Maximize2, Sparkles, X } from "lucide-react";
import { AssistantConversation } from "./assistant-conversation";
import { usePathname } from "next/navigation";
import { useScrollLockedEscape } from "@/hooks/use-scroll-locked-escape";

/**
 * The assistant launcher, pinned above the chat dock.
 *
 * Deliberately a separate surface from `ChatDock`: that one is conversations with real vendors,
 * this one is the ODOS Assistant. Stacking them rather than merging keeps "message a shop" and
 * "ask ODOS" from being confused for each other. The vertical offset is what keeps the two
 * buttons from overlapping — `ChatDock` owns `bottom-4`/`sm:bottom-6`.
 */
/**
 * Where a floating launcher would be in the way: its own full page, a dedicated vendor chat
 * thread, and checkout, where nothing should compete with paying.
 */
const HIDDEN_ON = [/^\/assistant$/, /^\/stores\/[^/]+\/chat$/, /^\/checkout/];

export function AssistantDock() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useScrollLockedEscape(open, () => setOpen(false));

  if (HIDDEN_ON.some((pattern) => pattern.test(pathname))) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask the ODOS Assistant"
        className="press fixed right-4 bottom-20 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-accent-foreground shadow-lg sm:right-6 sm:bottom-24"
      >
        <Sparkles className="size-4" aria-hidden />
        <span className="hidden text-sm font-medium min-[380px]:inline">Ask ODOS</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ODOS Assistant"
      className="fixed right-4 bottom-20 z-40 flex h-[min(32rem,calc(100vh-7rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:right-6 sm:bottom-24"
    >
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">ODOS Assistant</p>
        <Link
          href="/assistant"
          onClick={() => setOpen(false)}
          aria-label="Open the assistant full screen"
          className="press grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <Maximize2 className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close the assistant"
          className="press grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </header>

      <AssistantConversation className="min-h-0 flex-1" autoFocus />
    </div>
  );
}
