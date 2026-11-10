import { PAYMENTS_ENDPOINTS } from "@/libs/api-endpoint";
import type {
  CheckoutSessionCreate,
  CheckoutSessionRead,
  PaymentVerificationRead,
} from "@/types/api";
import type { Order } from "@/types/order";
import { apiFetch } from "./http";
import { toOrder } from "./mappers";

export type { CheckoutSessionCreate, CheckoutSessionRead };

export const paymentsService = {
  /**
   * Creates the order and a hosted payment session in one call; redirect the shopper to
   * `authorization_url`, then verify the `reference` when they come back.
   */
  checkout: (input: CheckoutSessionCreate) =>
    apiFetch<CheckoutSessionRead>(PAYMENTS_ENDPOINTS.checkout, {
      method: "POST",
      body: input,
    }),

  async verify(reference: string): Promise<PaymentVerification> {
    const result = await apiFetch<PaymentVerificationRead>(
      PAYMENTS_ENDPOINTS.verify(reference),
      {
        method: "POST",
      },
    );
    const combined = `${result.payment_status} ${result.provider_status}`;
    const paid =
      /paid|success/i.test(combined) && !/unpaid|fail/i.test(result.payment_status);
    return {
      reference: result.reference,
      // Free-text on the wire: treat "paid"/"success" as paid, anything else as not (yet) paid.
      paid,
      // Mobile money settles out of band -- the shopper approves a prompt on
      // their handset, which routinely lands after they are back on the site.
      // Anything not yet paid and not explicitly dead is still in flight, and
      // saying "not completed" to someone who is mid-approval is wrong. The API
      // takes the same view: it collapses unknown provider statuses to pending.
      pending: !paid && !/fail|cancel|abandon|expire|declin/i.test(combined),
      status: result.payment_status,
      message: result.message,
      order: toOrder(result.order),
    };
  },
};

export type PaymentVerification = {
  reference: string;
  paid: boolean;
  /** Still in flight: worth asking again rather than reporting a failure. */
  pending: boolean;
  status: string;
  message: string;
  order: Order;
};
