import { PAYMENTS_ENDPOINTS } from "@/libs/api-endpoint";
import type { components } from "@/types/api-schema";
import type { Order } from "@/types/order";
import { apiFetch } from "./http";
import { toOrder } from "./mappers";

export type CheckoutSessionCreate = components["schemas"]["CheckoutSessionCreate"];
export type CheckoutSessionRead = components["schemas"]["CheckoutSessionRead"];

export const paymentsService = {
  /**
   * Creates the order and a hosted payment session in one call; redirect the shopper to
   * `authorization_url`, then verify the `reference` when they come back.
   */
  checkout: (input: CheckoutSessionCreate) =>
    apiFetch<CheckoutSessionRead>(PAYMENTS_ENDPOINTS.checkout, { method: "POST", body: input }),

  async verify(reference: string): Promise<PaymentVerification> {
    const result = await apiFetch<components["schemas"]["PaymentVerificationRead"]>(PAYMENTS_ENDPOINTS.verify(reference), {
      method: "POST",
    });
    return {
      reference: result.reference,
      // Free-text on the wire: treat "paid"/"success" as paid, anything else as not (yet) paid.
      paid: /paid|success/i.test(`${result.payment_status} ${result.provider_status}`) && !/unpaid|fail/i.test(result.payment_status),
      status: result.payment_status,
      message: result.message,
      order: toOrder(result.order),
    };
  },
};

export type PaymentVerification = {
  reference: string;
  paid: boolean;
  status: string;
  message: string;
  order: Order;
};
