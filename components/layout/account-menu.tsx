"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Award, Bell, LogOut, MailCheck, PieChart, ShoppingBag, Smartphone, Store, Truck, User } from "lucide-react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLogout, useSession } from "@/hooks/use-auth";

/** "Tricia Kanate" → "TK"; a single name gives one letter. */
function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  vendor: "Vendor",
  admin: "Admin",
  courier: "Courier",
};

const menuItemClass =
  "press flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left text-base hover:bg-surface-muted";

function MenuLink({
  href,
  icon: Icon,
  onSelect,
  highlight,
  children,
}: {
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  onSelect: () => void;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className={`${menuItemClass}${highlight ? " font-medium text-accent" : ""}`}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {children}
    </Link>
  );
}

/** Logged out: Log in / Sign up. Logged in: an avatar menu with orders and log out. */
export function AccountMenu() {
  const session = useSession();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Close on a click/tap outside the menu, or on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Navigating anywhere (including via a link in the menu) closes it.
  useEffect(() => setOpen(false), [pathname]);

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

  const { full_name: name, email, is_verified: emailVerified, phone_verified: phoneVerified, role } = session.user;
  const roleLabel = ROLE_LABELS[role] ?? role.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const close = () => setOpen(false);

  return (
    <>
      <div ref={menu} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="press grid size-9 cursor-pointer place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent min-[320px]:size-10 min-[320px]:text-sm"
          aria-label={`Account menu for ${name}`}
        >
          {initials(name)}
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-3xl border border-line bg-surface p-2 shadow-xl"
          >
            <div className="flex items-center gap-4 rounded-2xl bg-surface-muted p-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-lg font-semibold text-accent-foreground"
                aria-hidden
              >
                {initials(name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{name}</p>
                <p className="truncate text-sm text-muted">{email}</p>
                <span className="mt-1.5 inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                  {roleLabel}
                </span>
              </div>
            </div>

            <div className="mt-1.5 space-y-0.5">
              {!emailVerified && (
                <MenuLink href="/verify-email" icon={MailCheck} onSelect={close} highlight>
                  Verify your email
                </MenuLink>
              )}
              {!phoneVerified && (
                <MenuLink href="/verify-phone" icon={Smartphone} onSelect={close}>
                  Verify your phone
                </MenuLink>
              )}
              <MenuLink href="/account" icon={User} onSelect={close}>
                Personal Account
              </MenuLink>
              <MenuLink href="/account?tab=vendor" icon={Store} onSelect={close}>
                Vendor Account
              </MenuLink>
              <MenuLink href="/orders" icon={ShoppingBag} onSelect={close}>
                Your Orders
              </MenuLink>
              <MenuLink href="/account?tab=loyalty" icon={Award} onSelect={close}>
                Loyalty Points
              </MenuLink>
              <MenuLink href="/notifications" icon={Bell} onSelect={close}>
                Notifications
              </MenuLink>
              {/courier/.test(role) && (
                <MenuLink href="/courier" icon={Truck} onSelect={close}>
                  Courier
                </MenuLink>
              )}
              {/admin/.test(role) && (
                <MenuLink href="/insights" icon={PieChart} onSelect={close}>
                  Customer insights
                </MenuLink>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  setConfirmOpen(true);
                }}
                className={menuItemClass}
              >
                <LogOut className="size-5 shrink-0" aria-hidden />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>

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
