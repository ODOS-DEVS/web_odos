import type { Metadata } from "next";
import { ProfileView } from "@/components/account/profile-view";

// Private to the logged-in shopper, same as /orders.
export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

export default function AccountPage() {
  return <ProfileView />;
}
