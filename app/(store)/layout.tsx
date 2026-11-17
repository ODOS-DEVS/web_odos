import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ChatDock } from "@/components/chat/chat-dock";
import { AssistantDock } from "@/components/assistant/assistant-dock";
import { PendingPaymentResumer } from "@/components/checkout/pending-payment-resumer";

// Each page warms its own slice of the query cache (see the `HydrationBoundary` in the pages below),
// so the layout stays a plain shell.
export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
      >
        Skip to content
      </a>
      <div className="no-print">
        <SiteHeader />
      </div>
      <main id="main" className="flex-1">
        {children}
      </main>
      <div className="no-print">
        <SiteFooter />
      </div>
      {/* Pinned to the viewport, so it rides along on every storefront page. */}
      <div className="no-print">
        <ChatDock />
        {/* Stacked above the chat dock: vendor conversations and the ODOS Assistant are
            different things, so they get different buttons. */}
        <AssistantDock />
      </div>
      {/* Renders nothing; watches for a payment the shopper left unfinished. */}
      <PendingPaymentResumer />
    </>
  );
}
