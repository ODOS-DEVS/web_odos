import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { first, safeNext } from "@/libs/url";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const next = safeNext(first((await searchParams).next));
  return <AuthForm mode="signup" next={next} />;
}
