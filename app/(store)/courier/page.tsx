import type { Metadata } from "next";
import { CourierView } from "@/components/courier/courier-view";

export const metadata: Metadata = { title: "Courier", robots: { index: false } };

export default function CourierPage() {
  return <CourierView />;
}
