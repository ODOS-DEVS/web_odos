"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, RotateCcw, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import { ASSISTANT_PROMPTS, useAssistant } from "@/hooks/use-assistant";
import type { AssistantContext, AssistantMessage, AssistantProduct, AssistantStore } from "@/types/assistant";

/** A product the assistant surfaced, linked straight to its real page. */
function ProductCard({ product }: { product: AssistantProduct }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="press flex w-44 shrink-0 flex-col gap-2 rounded-xl border border-line bg-surface p-2.5 hover:border-foreground"
    >
      <Media src={product.imageUrl} name={product.title} sizes="160px" className="aspect-square w-full rounded-lg" />
      <span className="line-clamp-2 text-xs font-medium">{product.title}</span>
      <span className="mt-auto flex items-baseline gap-1.5">
        <span className="text-sm font-semibold">{formatMoney(product.price)}</span>
        {product.oldPrice !== null && product.oldPrice > product.price && (
          <span className="text-[11px] text-muted line-through">{formatMoney(product.oldPrice)}</span>
        )}
      </span>
    </Link>
  );
}

function StoreChip({ store }: { store: AssistantStore }) {
  return (
    <Link
      href={`/stores/${store.id}`}
      className="press inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-3.5 pl-2 text-xs font-medium hover:border-foreground"
    >
      <Media src={store.imageUrl} name={store.title} sizes="24px" className="size-6 rounded-full" />
      {store.title}
    </Link>
  );
}

function Bubble({
  message,
  onFeedback,
  onRetry,
}: {
  message: AssistantMessage;
  onFeedback: (rating: 1 | -1) => void;
  onRetry: () => void;
}) {
  const [rated, setRated] = useState<1 | -1 | null>(null);
  const mine = message.role === "user";

  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
          mine ? "bg-foreground text-background" : "bg-surface-muted text-foreground",
          message.failed && "bg-danger-soft text-danger",
        )}
      >
        {message.pending ? (
          <span className="flex items-center gap-2 text-muted">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Searching the marketplace…
          </span>
        ) : (
          message.content
        )}
      </div>

      {message.failed && (
        <Button type="button" variant="ghost" size="sm" className="mt-1.5" onClick={onRetry}>
          <RotateCcw className="size-3.5" aria-hidden />
          Try again
        </Button>
      )}

      {message.products.length > 0 && (
        <div className="no-scrollbar mt-2.5 flex w-full gap-2.5 overflow-x-auto pb-1">
          {message.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {message.stores.length > 0 && (
        <div className="no-scrollbar mt-2 flex w-full gap-2 overflow-x-auto pb-1">
          {message.stores.map((store) => (
            <StoreChip key={store.id} store={store} />
          ))}
        </div>
      )}

      {message.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.actions.map((action) => (
            <Link
              key={`${action.label}-${action.rawRoute}`}
              href={action.href!}
              className="press inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium hover:border-foreground"
            >
              {action.label}
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          ))}
        </div>
      )}

      {message.escalatedToSupport && (
        <Badge tone="warning" className="mt-2">
          Passed to the ODOS support team
        </Badge>
      )}

      {/* Only a stored reply can be rated — the API keys feedback on a real message id. */}
      {!mine && !message.pending && !message.failed && message.id !== "welcome" && !message.id.startsWith("pending-") && (
        <div className="mt-1.5 flex items-center gap-1">
          {([1, -1] as const).map((rating) => (
            <button
              key={rating}
              type="button"
              aria-label={rating === 1 ? "Helpful" : "Not helpful"}
              aria-pressed={rated === rating}
              onClick={() => {
                setRated(rating);
                onFeedback(rating);
              }}
              className={cn(
                "press grid size-7 place-items-center rounded-full text-muted hover:bg-surface-muted",
                rated === rating && "text-accent",
              )}
            >
              {rating === 1 ? <ThumbsUp className="size-3.5" aria-hidden /> : <ThumbsDown className="size-3.5" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The conversation itself, shared by the floating panel and the full `/assistant` page so there
 * is one implementation of the thread rather than two that drift.
 */
export function AssistantConversation({
  context,
  className,
  autoFocus,
}: {
  context?: AssistantContext | null;
  className?: string;
  autoFocus?: boolean;
}) {
  const { messages, status, isSending, hasConversation, nudge, send, retry, reset, submitFeedback } =
    useAssistant(context);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft;
    setDraft("");
    void send(text);
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Said plainly: without an LLM configured this is keyword product search, not a chatbot. */}
        {status && !status.enabled && (
          <p className="rounded-xl bg-surface-muted p-3 text-xs leading-5 text-muted">
            Smart answers are off right now, so I&apos;m searching the catalogue by keyword. Product and store
            suggestions below are real.
          </p>
        )}

        {messages.map((message) => (
          <Bubble
            key={message.id}
            message={message}
            onRetry={retry}
            onFeedback={(rating) => void submitFeedback(message.id, rating)}
          />
        ))}

        {nudge && !hasConversation && (
          <button
            type="button"
            onClick={() => void send(nudge.prompt)}
            className="press w-full rounded-xl border border-accent/40 bg-accent-soft p-3 text-left text-xs text-accent"
          >
            {nudge.message}
          </button>
        )}

        {!hasConversation && (
          <div className="flex flex-wrap gap-2">
            {ASSISTANT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void send(prompt)}
                className="press rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium hover:border-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoFocus={autoFocus}
          maxLength={2000}
          aria-label="Ask the ODOS Assistant"
          placeholder="Ask about products, stores or an order…"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
        />
        {hasConversation && (
          <Button type="button" variant="ghost" size="icon" aria-label="Clear conversation" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden />
          </Button>
        )}
        <Button type="submit" size="icon" aria-label="Send" disabled={isSending || !draft.trim()}>
          {isSending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        </Button>
      </form>
    </div>
  );
}
