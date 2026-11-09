import type { Metadata } from "next";
import { SegmentationView } from "@/components/insights/segmentation-view";

export const metadata: Metadata = { title: "Customer insights", robots: { index: false } };

export default function InsightsPage() {
  return <SegmentationView />;
}
