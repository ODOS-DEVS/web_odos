import type { CheckoutSessionCreate, PaymentVerification } from "@/services/payments.service";
import { MOCK_CHECKOUT_REFERENCE, MOCK_ORDERS } from "./orders.mock";

/** Temporary dummy checkout/payment flow standing in for `paymentsService`. Delete along with `mocks/`. */

/** Same-site path, so the existing `window.location.assign(session.authorization_url)` lands on our own success page. */
export function mockCheckout(_input: CheckoutSessionCreate): { authorization_url: string } {
  return { authorization_url: `/checkout/success?reference=${MOCK_CHECKOUT_REFERENCE}` };
}

export function mockPaymentVerification(reference: string): PaymentVerification {
  const order = MOCK_ORDERS[0];
  const paid = reference === MOCK_CHECKOUT_REFERENCE;
  return {
    reference,
    paid,
    status: paid ? "paid" : "failed",
    message: paid ? "Payment confirmed." : "We couldn't find a payment for that reference.",
    order,
  };
}
