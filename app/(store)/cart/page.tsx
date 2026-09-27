import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Your cart</h1>
      <CartView />
    </Container>
  );
}
