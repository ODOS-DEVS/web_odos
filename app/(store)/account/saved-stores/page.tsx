import type { Metadata } from "next";
import { SavedStoresView } from "@/components/store/saved-stores-view";

export const metadata: Metadata = {
  title: "Saved stores",
  description: "Stores you saved on ODOS.",
};

/** The shareable, directly-linkable saved-stores page. Mirrored as a tab inside /account. */
export default function SavedStoresPage() {
  return <SavedStoresView />;
}
