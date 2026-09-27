"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Package, User } from "lucide-react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/button";
import { useSession } from "@/hooks/use-auth";
import { mockLogout } from "@/mocks/auth.mock";
import { useFakeMutation } from "@/mocks/mutation";

/** Logged out: Log in / Sign up. Logged in: an avatar menu with orders and log out. */
export function AccountMenu() {
  const session = useSession();
  const logout = useFakeMutation(mockLogout);
  const router = useRouter();
  const menu = useRef<HTMLDetailsElement>(null);

  if (!session) {
    return (
      <>
        <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
          Log in
        </ButtonLink>
        <ButtonLink href="/signup" variant="primary" size="sm" className="hidden sm:inline-flex">
          Sign up
        </ButtonLink>
        <Link
          href="/login"
          className="press grid size-10 place-items-center rounded-full hover:bg-surface-muted sm:hidden"
          aria-label="Log in"
        >
          <User className="size-5" aria-hidden />
        </Link>
      </>
    );
  }

  const { full_name: name, email } = session.user;
  const close = () => menu.current?.removeAttribute("open");

  return (
    <details ref={menu} className="group relative">
      <summary
        className="press grid size-10 cursor-pointer list-none place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent marker:hidden [&::-webkit-details-marker]:hidden"
        aria-label={`Account menu for ${name}`}
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-lg">
        <div className="border-b border-line px-3 py-2.5">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>
        <Link
          href="/orders"
          onClick={close}
          className="press mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-muted"
        >
          <Package className="size-4 text-muted" aria-hidden />
          Your orders
        </Link>
        <button
          type="button"
          onClick={() => {
            close();
            logout.mutate(undefined, {
              onSuccess: () => {
                toast.success("You’re logged out");
                router.refresh();
              },
            });
          }}
          className="press flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-surface-muted"
        >
          <LogOut className="size-4 text-muted" aria-hidden />
          Log out
        </button>
      </div>
    </details>
  );
}
