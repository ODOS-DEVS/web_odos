"use client";

import { CloudOff, RotateCw } from "lucide-react";
import { ApiError } from "@/services/http";
import { Button } from "./button";

/** Friendly failure state for a query, with a retry that re-runs the request. */
export function QueryError({ error, onRetry, title = "We couldn’t load this" }: { error: unknown; onRetry?: () => void; title?: string }) {
  const message =
    error instanceof ApiError ? error.message : "Something went wrong while loading this. Please try again.";

  return (
    <div role="alert" className="grid place-items-center rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      <CloudOff className="size-10 text-muted" aria-hidden />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button className="mt-6" variant="outline" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
