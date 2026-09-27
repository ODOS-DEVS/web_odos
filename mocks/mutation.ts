"use client";

import { useCallback, useState } from "react";

type MutateOptions<TResult> = {
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
};

/**
 * Temporary stand-in for `useMutation`, so components written against TanStack Query's mutation shape
 * (`.mutate(input, {onSuccess, onError})`, `.isPending`, `.isSuccess`, `.error`) don't need to change
 * while they're fed a fake resolver instead of a real network call. Delete along with `mocks/`.
 */
export function useFakeMutation<TInput, TResult>(resolver: (input: TInput) => TResult | Promise<TResult>, delayMs = 500) {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(
    (input: TInput, options?: MutateOptions<TResult>) => {
      setIsPending(true);
      setError(null);
      setTimeout(() => {
        Promise.resolve()
          .then(() => resolver(input))
          .then((result) => {
            setIsPending(false);
            setIsSuccess(true);
            options?.onSuccess?.(result);
          })
          .catch((err: unknown) => {
            setIsPending(false);
            setError(err);
            options?.onError?.(err);
          });
      }, delayMs);
    },
    [resolver, delayMs],
  );

  return { mutate, isPending, isSuccess, error };
}
