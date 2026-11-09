"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, LogOut, ShoppingBag, Store, User } from "lucide-react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLogout, useSession } from "@/hooks/use-auth";

/** Logged out: Log in / Sign up. Logged in: an avatar menu with orders and log out. */
export function AccountMenu() {
  const session = useSession();
  const logout = useLogout();
  const router = useRouter();
  const menu = useRef<HTMLDetailsElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
          className="press grid size-9 place-items-center rounded-full hover:bg-surface-muted min-[320px]:size-10 sm:hidden"
          aria-label="Log in"
        >
          <User className="size-4.5 min-[320px]:size-5" aria-hidden />
        </Link>
      </>
    );
  }

  const { full_name: name, email, avatar_url: avatarUrl } = session.user;
  const close = () => menu.current?.removeAttribute("open");

  return (
    <>
      <details ref={menu} className="group relative">
        <summary
          className="press cursor-pointer list-none rounded-full marker:hidden [&::-webkit-details-marker]:hidden"
          aria-label={`Account menu for ${name}`}
        >
          <UserAvatar
            name={name}
            avatarUrl={avatarUrl}
            sizes="40px"
            className="size-9 text-xs min-[320px]:size-10 min-[320px]:text-sm"
          />
        </summary>
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-lg">
          <div className="flex items-center gap-2.5 border-b border-line px-3 py-2.5">
            <UserAvatar name={name} avatarUrl={avatarUrl} sizes="36px" className="size-9 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
          </div>
          <Link
            href="/account"
            onClick={close}
            className="press mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-muted"
          >
            <User className="size-4 text-muted" aria-hidden />
            Personal Account
          </Link>
          <Link
            href="/account?tab=vendor"
            onClick={close}
            className="press flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-muted"
          >
            <Store className="size-4 text-muted" aria-hidden />
            Vendor Account
          </Link>
          <Link
            href="/orders"
            onClick={close}
            className="press flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-muted"
          >
            <ShoppingBag className="size-4 text-muted" aria-hidden />
            Your Orders
          </Link>
          <Link
            href="/account?tab=loyalty"
            onClick={close}
            className="press flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-muted"
          >
            <Award className="size-4 text-muted" aria-hidden />
            Loyalty Points
          </Link>
          <button
            type="button"
            onClick={() => {
              close();
              setConfirmOpen(true);
            }}
            className="press flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-surface-muted"
          >
            <LogOut className="size-4 text-muted" aria-hidden />
            Log out
          </button>
        </div>
      </details>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out of ODOS?"
        description={`You’re signed in as ${email}. You can always log back in.`}
        confirmLabel="Log out"
        cancelLabel="Cancel"
        pending={logout.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          logout.mutate(undefined, {
            onSuccess: () => {
              setConfirmOpen(false);
              toast.success("You’re logged out");
              router.refresh();
            },
          })
        }
      />
    </>
  );
}
