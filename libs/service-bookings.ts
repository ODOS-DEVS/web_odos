import type { BookingStatus } from "@/types/services";

/**
 * The booking state machine, from the provider's side.
 *
 * Mirrors `TRANSITIONS` and `ALLOWED_ACTORS` in the backend's
 * `app/services/service_booking_state.py`, filtered to the transitions a **provider** may make.
 * The backend refuses anything else, so offering a button for it would only produce an error —
 * the same mistake the vendor order ladder used to make.
 *
 * Deliberately absent: `pending_payment -> confirmed` and the two `expired` transitions are
 * system-only, and resolving a dispute is admin-only.
 */
export const PROVIDER_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending_provider: ["confirmed", "pending_payment", "declined"],
  pending_payment: ["cancelled"],
  confirmed: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  declined: [],
  expired: [],
  disputed: [],
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending_provider: "Awaiting your response",
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
  expired: "Expired",
  disputed: "Disputed",
};

/** Imperative wording for the button that performs each transition. */
export const BOOKING_ACTION_LABELS: Partial<Record<BookingStatus, string>> = {
  confirmed: "Accept booking",
  pending_payment: "Accept, ask for payment",
  declined: "Decline",
  in_progress: "Start work",
  completed: "Mark complete",
  cancelled: "Cancel",
};

const ALL = new Set<string>(Object.keys(PROVIDER_TRANSITIONS));

export function toBookingStatus(status: string): BookingStatus {
  const value = status.trim().toLowerCase();
  return ALL.has(value) ? (value as BookingStatus) : "pending_provider";
}

export const providerActions = (status: BookingStatus) => PROVIDER_TRANSITIONS[status] ?? [];

/** Work the provider still owes someone, for the queue counts. */
export const OPEN_BOOKING_STATUSES: BookingStatus[] = [
  "pending_provider",
  "pending_payment",
  "confirmed",
  "in_progress",
];

export const isBookingOpen = (status: BookingStatus) => OPEN_BOOKING_STATUSES.includes(status);
