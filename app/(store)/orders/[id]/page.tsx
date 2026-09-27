import type { Metadata } from "next";
import { OrderView } from "@/components/orders/order-view";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  return <OrderView id={id} />;
}
