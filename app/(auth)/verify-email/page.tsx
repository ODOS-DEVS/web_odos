import type { Metadata } from "next";
import { VerifyEmailForm } from "@/components/auth/verify-forms";
import { first, safeNext } from "@/libs/url";

export const metadata: Metadata = { title: "Verify your email" };

export default async function Page({ searchParams }: PageProps<"/verify-email">) {
  const next = safeNext(first((await searchParams).next), "/");
  return <VerifyEmailForm next={next} />;
}
