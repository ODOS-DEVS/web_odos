"use client";

import { CloudOff, RotateCw } from "lucide-react";
import { ApiError } from "@/services/http";
import { EmptyState } from "./empty-state";
import { Button } from "./button";

/** Friendly failure state for a query, with a retry that re-runs the request. */
export function QueryError({ error, onRetry, title = "We couldn’t load this" }: { error: unknown; onRetry?: () => void; title?: string }) {
  const message =
    error instanceof ApiError ? error.message : "Something went wrong while loading this. Please try again.";

  return (
    <EmptyState
      role="alert"
      icon={<CloudOff className="size-10 text-muted" aria-hidden />}
      title={title}
      description={message}
      className="py-16"
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden />
            Try again
          </Button>
        )
      }
    />
  );
}
