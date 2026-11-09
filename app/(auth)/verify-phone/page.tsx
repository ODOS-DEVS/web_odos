import type { Metadata } from "next";
import { VerifyPhoneForm } from "@/components/auth/verify-forms";
import { first, safeNext } from "@/libs/url";

export const metadata: Metadata = { title: "Verify your phone" };

export default async function Page({ searchParams }: PageProps<"/verify-phone">) {
  const next = safeNext(first((await searchParams).next), "/account");
  return <VerifyPhoneForm next={next} />;
}
