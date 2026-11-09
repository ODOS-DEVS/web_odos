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
import { useDetailsDismiss } from "@/hooks/use-details-dismiss";

/** Logged out: Log in / Sign up. Logged in: an avatar menu with orders and log out. */
export function AccountMenu() {
  const session = useSession();
  const logout = useLogout();
  const router = useRouter();
  const menu = useRef<HTMLDetailsElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  useDetailsDismiss(menu);

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

  const { full_name: name, email, avatar_url: avatarUrl, role } = session.user;
  const roleLabel = `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
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
        <div className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-1rem))] rounded-[1.5rem] border border-line bg-surface p-2 shadow-[0_24px_70px_rgba(22,20,15,0.18)]">
          <div className="flex items-center gap-3.5 rounded-[1.15rem] bg-surface-muted p-4">
            <UserAvatar
              name={name}
              avatarUrl={avatarUrl}
              sizes="64px"
              className="size-14 shrink-0 text-base sm:size-16 sm:text-lg"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold sm:text-base">{name}</p>
              <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{email}</p>
              <span className="mt-2 inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                {roleLabel}
              </span>
            </div>
          </div>
          <nav aria-label="Account" className="mt-2 space-y-0.5 pb-0.5">
            <Link
              href="/account"
              onClick={close}
              className="press flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm hover:bg-surface-muted sm:text-base"
            >
              <User className="size-5 shrink-0 text-muted" aria-hidden />
              Personal Account
            </Link>
            <Link
              href="/account?tab=vendor"
              onClick={close}
              className="press flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm hover:bg-surface-muted sm:text-base"
            >
              <Store className="size-5 shrink-0 text-muted" aria-hidden />
              Vendor Account
            </Link>
            <Link
              href="/orders"
              onClick={close}
              className="press flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm hover:bg-surface-muted sm:text-base"
            >
              <ShoppingBag className="size-5 shrink-0 text-muted" aria-hidden />
              Your Orders
            </Link>
            <Link
              href="/account?tab=loyalty"
              onClick={close}
              className="press flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm hover:bg-surface-muted sm:text-base"
            >
              <Award className="size-5 shrink-0 text-muted" aria-hidden />
              Loyalty Points
            </Link>
            <button
              type="button"
              onClick={() => {
                close();
                setConfirmOpen(true);
              }}
              className="press flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-left text-sm hover:bg-surface-muted sm:text-base"
            >
              <LogOut className="size-5 shrink-0 text-muted" aria-hidden />
              Log out
            </button>
          </nav>
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
