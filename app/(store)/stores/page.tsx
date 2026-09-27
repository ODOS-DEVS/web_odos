import type { Metadata } from "next";
import { StoresView } from "@/components/store/stores-view";

export const metadata: Metadata = {
  title: "Stores",
  description: "Independent vendors near you, each with their own riders and delivery rates.",
};

// `StoresView` reads `mocks/` directly, so there is nothing to prefetch server-side for now.
export default function StoresPage() {
  return <StoresView />;
}
