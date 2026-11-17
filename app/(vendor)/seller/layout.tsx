import type { ReactNode } from "react";
import type { Metadata } from "next";
import { VendorShell } from "@/components/vendor/vendor-shell";

/**
 * The whole Seller Center is private to one vendor, so nothing under it should ever be indexed.
 * Child pages add their own titles under this one.
 */
export const metadata: Metadata = {
  title: { default: "Seller Center", template: "%s · Seller Center" },
  robots: { index: false, follow: false },
};

export default function SellerLayout({ children }: { children: ReactNode }) {
  return <VendorShell>{children}</VendorShell>;
}
