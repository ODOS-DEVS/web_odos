"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { vendorService } from "@/services/vendor.service";
import { useSession } from "./use-auth";

/** Waits until typing pauses before searching, so each keystroke isn't a request. */
function useDebounced<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** The signed-in vendor's customers (GET /vendor/customers), searched on the server by `q`. */
export function useVendorCustomers(search: string) {
  const session = useSession();
  const q = useDebounced(search.trim());
  const query = useQuery({
    queryKey: ["vendor", "customers", q],
    queryFn: () => vendorService.customers(q),
    enabled: Boolean(session),
    // Keep the current list on screen while a new search loads.
    placeholderData: keepPreviousData,
  });
  return { ...query, searching: search.trim() !== q || (query.isFetching && query.isPlaceholderData) };
}
