"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, LockKeyhole, Menu, PanelsTopLeft, Store, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/libs/cn";
import { useMounted } from "@/hooks/use-mounted";
import { useSession } from "@/hooks/use-auth";
import { useVendorStatus, useVendorStore } from "@/hooks/use-vendor";
import { useVendorPortalCounts } from "@/hooks/use-vendor-portal";
import { VENDOR_NAV, isVendorNavItemActive, vendorPageTitle, type VendorNavCountKey } from "./vendor-nav";

function NavList({ counts, onNavigate }: { counts: Record<VendorNavCountKey, number>; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6" aria-label="Seller Center">
      {VENDOR_NAV.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[11px] font-semibold tracking-wide text-muted uppercase">{group.label}</p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = isVendorNavItemActive(item, pathname);
              const count = item.count ? counts[item.count] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{item.label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                          active ? "bg-accent text-accent-foreground" : "bg-surface-muted text-foreground",
                        )}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function StoreCard() {
  const { data: profile } = useVendorStore();
  const user = useSession()?.user;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-muted p-3">
      {profile?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Remote store logos are not in the image config allowlist.
        <img src={profile.logoUrl} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Store className="size-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{profile?.storeName ?? "Your store"}</p>
        <p className="truncate text-xs text-muted">{user?.email ?? "Seller Center"}</p>
      </div>
    </div>
  );
}

/** The seller workspace chrome: a persistent sidebar on desktop, a drawer below `lg`. */
export function VendorShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const mounted = useMounted();
  const session = useSession();
  const { status, isVendor, hasApplied } = useVendorStatus();
  const counts = useVendorPortalCounts();
  const user = session?.user;

  // Until the client knows whether a session exists, show a skeleton rather than flashing a login prompt.
  if (!mounted) return <div className="min-h-screen animate-pulse bg-surface-muted" aria-busy="true" />;

  if (!session) {
    return (
      <Gate
        title="Log in to the Seller Center"
        description="Your store, orders and earnings live behind a login."
        primary={{ href: `/login?next=${encodeURIComponent(pathname)}`, label: "Log in" }}
        secondary={{ href: `/signup?next=${encodeURIComponent(pathname)}`, label: "Create an account" }}
      />
    );
  }

  // Only `approved` opens the workspace — mirroring the mobile app, which turns pending,
  // under_review, rejected and suspended away from these screens.
  if (!isVendor) {
    return (
      <Gate
        title={hasApplied ? "Your application is still being reviewed" : "Start selling on ODOS"}
        description={
          hasApplied
            ? `Your vendor application is ${status.replace(/_/g, " ")}. We'll email you as soon as it's decided.`
            : "Apply for a vendor account to open your store, list products and take orders."
        }
        primary={
          hasApplied
            ? { href: "/account?tab=vendor", label: "View my application" }
            : { href: "/account?tab=vendor&apply=1", label: "Apply to sell" }
        }
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 flex-col gap-5 overflow-y-auto border-r border-line bg-surface px-4 py-5 lg:flex">
        <Link href="/" className="press flex items-center gap-2 px-2 text-sm font-semibold">
          <PanelsTopLeft className="size-5 text-accent" aria-hidden />
          ODOS <span className="text-muted">Seller</span>
        </Link>
        <StoreCard />
        <NavList counts={counts} />
        <div className="mt-auto space-y-1 border-t border-line pt-4">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">You are selling</p>
          <Link
            href="/account"
            className="press flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm font-medium hover:border-foreground"
          >
            <ArrowLeftRight className="size-4 shrink-0 text-accent" aria-hidden />
            Switch to shopping
          </Link>
          <Link href="/" className="press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-muted hover:text-foreground">
            <Store className="size-4 shrink-0" aria-hidden />
            Browse the storefront
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="press grid size-10 shrink-0 place-items-center rounded-full border border-line lg:hidden"
          >
            <Menu className="size-4" aria-hidden />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{vendorPageTitle(pathname)}</h1>
          <Link
            href="/account"
            className="press hidden shrink-0 items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm font-medium hover:border-foreground sm:inline-flex"
          >
            <ArrowLeftRight className="size-4 text-accent" aria-hidden />
            Shopping
          </Link>
          <ThemeToggle />
          <Link href="/seller/settings" className="press shrink-0 rounded-full" aria-label="Settings">
            <UserAvatar name={user?.full_name ?? "Vendor"} avatarUrl={user?.avatar_url} sizes="36px" className="size-9 text-sm" />
          </Link>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]" />
          <div role="dialog" aria-modal="true" aria-label="Seller Center menu" className="slide-in-left absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col gap-5 overflow-y-auto bg-surface px-4 py-5 shadow-2xl">
            <div className="flex items-center justify-between px-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <PanelsTopLeft className="size-5 text-accent" aria-hidden />
                ODOS <span className="text-muted">Seller</span>
              </span>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="press grid size-9 place-items-center rounded-full hover:bg-surface-muted">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <StoreCard />
            <NavList counts={counts} onNavigate={() => setMenuOpen(false)} />
            <div className="mt-auto space-y-1 border-t border-line pt-4">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="press flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm font-medium"
              >
                <ArrowLeftRight className="size-4 shrink-0 text-accent" aria-hidden />
                Switch to shopping
              </Link>
              <Link href="/" onClick={() => setMenuOpen(false)} className="press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-muted">
                <Store className="size-4 shrink-0" aria-hidden />
                Browse the storefront
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Gate({
  title,
  description,
  primary,
  secondary,
}: {
  title: string;
  description: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto grid min-h-screen max-w-xl place-items-center px-4">
      <EmptyState
        icon={<LockKeyhole className="size-6 text-muted" aria-hidden />}
        iconBadge
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href={primary.href} size="lg">
              {primary.label}
            </ButtonLink>
            {secondary && (
              <ButtonLink href={secondary.href} size="lg" variant="outline">
                {secondary.label}
              </ButtonLink>
            )}
          </div>
        }
      />
    </div>
  );
}
