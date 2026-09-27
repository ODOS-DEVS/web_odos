"use client";

import { QueryError } from "@/components/ui/query-error";
import { Container } from "@/components/ui/container";

/** Shown if a page's server render throws (for example the backend is unreachable). */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-16">
      <QueryError error={error} onRetry={reset} title="This page couldn’t load" />
    </Container>
  );
}
