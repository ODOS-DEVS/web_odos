"use client";

import type { CSSProperties, ReactNode } from "react";
import { AddressSkeleton } from "@/components/account/address-tab";
import { ChatsSkeleton } from "@/components/account/chats-tab";
import { LoyaltySkeleton } from "@/components/account/loyalty-tab";
import { PaymentMethodsSkeleton } from "@/components/account/payment-methods-tab";
import { ReturnsSkeleton } from "@/components/account/returns-tab";
import { ReviewsSkeleton } from "@/components/account/reviews-tab";
import { VendorSkeleton } from "@/components/account/vendor-tab";
import { VouchersSkeleton } from "@/components/account/vouchers-tab";
import { WalletSkeleton } from "@/components/account/wallet-tab";
import { SellerDashboardSkeleton } from "@/components/vendor/seller-dashboard";
import { VendorCustomersSkeleton } from "@/components/vendor/vendor-customers-tab";
import { VendorOrdersSkeleton } from "@/components/vendor/vendor-orders-tab";
import { VendorProductsListSkeleton } from "@/components/vendor/vendor-products-tab";
import { cn } from "@/libs/cn";

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-muted", className)} style={style} />;
}

function FieldBone() {
  return (
    <div>
      <Bone className="mb-2 h-4 w-24" />
      <Bone className="h-12 w-full rounded-xl" />
    </div>
  );
}

/** The Profile tab's form (Personal details + Notifications). */
function ProfileFormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading your profile">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <Bone className="h-6 w-40" />
        <Bone className="mt-5 mb-6 size-20 rounded-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 9 }, (_, i) => (
            <FieldBone key={i} />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <Bone className="h-6 w-32" />
        <Bone className="mt-2 h-4 w-3/4" />
        <div className="mt-4 space-y-5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-64 max-w-full" />
              </div>
              <Bone className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Search + filter + "Add product" row above the product cards. */
function ProductsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Bone className="h-11 w-full rounded-full sm:w-auto sm:flex-1" />
        <Bone className="h-11 flex-1 rounded-full sm:w-40 sm:flex-none" />
        <Bone className="h-11 flex-1 rounded-full sm:w-36 sm:flex-none" />
      </div>
      <VendorProductsListSkeleton />
    </div>
  );
}

function HelpSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => (
        <Bone key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

/**
 * Each tab's body uses the exact skeleton that tab shows while its own data loads, so the page goes
 * straight from this placeholder to the tab's placeholder (or its content) with no change of shape.
 */
const TAB_SKELETONS: Record<string, () => ReactNode> = {
  profile: () => <ProfileFormSkeleton />,
  address: () => <AddressSkeleton />,
  payment: () => <PaymentMethodsSkeleton />,
  wallet: () => <WalletSkeleton />,
  loyalty: () => <LoyaltySkeleton />,
  vouchers: () => <VouchersSkeleton />,
  reviews: () => <ReviewsSkeleton />,
  chats: () => <ChatsSkeleton />,
  returns: () => <ReturnsSkeleton />,
  help: () => <HelpSkeleton />,
  vendor: () => <VendorSkeleton />,
  dashboard: () => <SellerDashboardSkeleton />,
  orders: () => <VendorOrdersSkeleton />,
  products: () => <ProductsSkeleton />,
  customers: () => <VendorCustomersSkeleton />,
};

/** The active tab's body skeleton on its own (no header or tab row). */
export function TabSkeleton({ tab }: { tab?: string | null }) {
  return <>{(TAB_SKELETONS[tab ?? "profile"] ?? TAB_SKELETONS.profile)()}</>;
}

/** The account page while the session is read: header card, tab row, and the active tab's skeleton. */
export function ProfileSkeleton({ tab }: { tab?: string | null }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your account">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <Bone className="size-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bone className="h-5 w-48 max-w-full" />
          <Bone className="h-4 w-56 max-w-full" />
          <Bone className="h-3 w-32" />
        </div>
      </div>

      <div className="flex gap-5 overflow-hidden border-b border-line pb-3">
        {[56, 76, 112, 52, 92, 64, 60].map((width, i) => (
          <Bone key={i} className="h-4 shrink-0" style={{ width }} />
        ))}
      </div>

      <div className="mt-6">
        <TabSkeleton tab={tab} />
      </div>
    </div>
  );
}
