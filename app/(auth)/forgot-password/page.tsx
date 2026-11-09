import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { first, safeNext } from "@/libs/url";

export const metadata: Metadata = { title: "Reset password" };

export default async function Page({ searchParams }: PageProps<"/forgot-password">) {
  const next = safeNext(first((await searchParams).next), "/");
  return <ForgotPasswordForm next={next} />;
}
