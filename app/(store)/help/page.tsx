import type { Metadata } from "next";
import { HelpView } from "@/components/help/help-view";

export const metadata: Metadata = {
  title: "Help & support",
  description: "Answers about ordering, delivery, payment, vouchers and returns on ODOS.",
};

export default function HelpPage() {
  return <HelpView />;
}
