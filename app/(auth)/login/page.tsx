import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { first, safeNext } from "@/libs/url";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext(first((await searchParams).next));
  return <AuthForm mode="login" next={next} />;
}
