"use client";

import { useState, type FormEvent } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useSession } from "@/hooks/use-auth";
import { useAwardLoyaltyPoints } from "@/hooks/use-loyalty";

/** Admin-only tool (POST /loyalty/admin/award). Renders nothing for anyone else. */
export function AwardPointsForm() {
  const session = useSession();
  const award = useAwardLoyaltyPoints();
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  const role = session?.user.role ?? "";
  if (!/admin/.test(role)) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(points);
    if (!userId.trim() || !Number.isInteger(n) || n <= 0 || !reason.trim()) return toast.error("Fill in a user id, whole points and a reason");
    award.mutate(
      { userId, points: n, reason },
      {
        onSuccess: () => {
          toast.success(`Awarded ${n} points`);
          setPoints("");
          setReason("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-normal">
        <Gift className="size-4.5 text-accent" aria-hidden /> Award bonus points
      </h2>
      <p className="mt-1 text-sm text-muted">Admin only. Points are added to the customer’s loyalty balance.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
        <Field id="award-user" label="Customer user ID" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        <Field id="award-points" label="Points" type="number" min={1} step={1} value={points} onChange={(e) => setPoints(e.target.value)} required />
      </div>
      <Field id="award-reason" label="Reason" className="mt-3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Goodwill for a delayed delivery" required />
      <Button type="submit" variant="accent" className="mt-4" disabled={award.isPending}>
        {award.isPending ? "Awarding…" : "Award points"}
      </Button>
    </form>
  );
}
