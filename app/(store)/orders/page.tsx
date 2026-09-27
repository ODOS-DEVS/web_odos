import type { Metadata } from "next";
import { OrdersView } from "@/components/orders/orders-view";
import { first } from "@/libs/url";

// Orders are private to the logged-in shopper, so they are fetched in the browser with their token.
export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const status = first((await searchParams).status);
  return <OrdersView status={status} />;
}
