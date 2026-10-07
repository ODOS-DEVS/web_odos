"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReturnRequest, ReturnRequestType } from "@/types/returns";
import { useMounted } from "./use-mounted";

type SubmitInput = {
  itemId: string;
  type: ReturnRequestType;
  quantity: number;
  reason: string;
  details: string;
  photoNames: string[];
};

type ReturnsState = {
  requests: ReturnRequest[];
  submit: (input: SubmitInput) => ReturnRequest;
};

// There's no returns endpoint wired up yet, so requests live in the browser like wallet/favorites.
const useReturnsStore = create<ReturnsState>()(
  persist(
    (set, get) => ({
      requests: [],
      submit: (input) => {
        const request: ReturnRequest = { ...input, id: crypto.randomUUID(), status: "pending", createdAt: new Date().toISOString() };
        set({ requests: [request, ...get().requests] });
        return request;
      },
    }),
    { name: "odos-returns-v1" },
  ),
);

/** The shopper's filed return/exchange/refund requests. `ready` is false until the client has mounted. */
export function useReturns() {
  const ready = useMounted();
  const stored = useReturnsStore((s) => s.requests);
  const submit = useReturnsStore((s) => s.submit);
  const requests = useMemo(() => (ready ? stored : []), [ready, stored]);
  return { ready, requests, submit };
}

/** The most recent request filed against a given eligible item, if any. */
export function useReturnRequestForItem(itemId: string) {
  const ready = useMounted();
  const request = useReturnsStore((s) => s.requests.find((r) => r.itemId === itemId));
  return ready ? request : undefined;
}
