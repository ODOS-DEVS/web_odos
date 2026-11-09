import type { Metadata } from "next";
import { ProfileView } from "@/components/account/profile-view";
import { first } from "@/libs/url";

// Private to the logged-in shopper, same as /orders.
export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const tab = first((await searchParams).tab);
  return <ProfileView initialTab={tab} />;
}
