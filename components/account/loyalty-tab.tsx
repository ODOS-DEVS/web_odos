import { Award } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function LoyaltyTab() {
  return (
    <EmptyState
      icon={<Award className="size-6 text-muted" aria-hidden />}
      iconBadge
      title="Loyalty points are coming soon"
      description="Earn points on every order and redeem them at checkout. We're still building this out — check back soon."
    />
  );
}
