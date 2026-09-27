import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Checkout</h1>
      <CheckoutView />
    </Container>
  );
}
