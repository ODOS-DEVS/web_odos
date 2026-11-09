"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircle2, CalendarClock, MessagesSquare, RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select";
import { useOrderActions } from "@/hooks/use-orders";
import type { Store } from "@/types/catalog";
import type { OrderPackage } from "@/types/order";

/** Short labels; the API caps `reason` at 40 characters. */
const PROBLEM_REASONS = ["Not delivered", "Damaged item", "Wrong item", "Missing item", "Late delivery", "Other"] as const;

type Panel = "problem" | "reschedule" | null;

const textareaClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none transition-colors hover:border-foreground/40 focus:border-foreground sm:text-sm";

/**
 * What the shopper can do with one vendor's package, depending on where it is:
 * on the way → confirm it arrived / ask to reschedule / report a problem; delivered → report a problem
 * or start a return. Chatting with the store is always available.
 */
export function PackageActions({ orderId, pkg, store }: { orderId: string; pkg: OrderPackage; store?: Store }) {
  const actions = useOrderActions(orderId);
  const [panel, setPanel] = useState<Panel>(null);
  const [reason, setReason] = useState<string>("");
  const [text, setText] = useState("");

  const inTransit = pkg.status === "out_for_delivery" || pkg.status === "delayed";
  const delivered = pkg.status === "delivered";
  const open = (next: Panel) => {
    setPanel(panel === next ? null : next);
    setText("");
    setReason("");
  };

  const onConfirm = () =>
    actions.confirmPackage.mutate(pkg.id, {
      onSuccess: () => toast.success(`Thanks — ${pkg.storeName}’s package is marked as received`),
      onError: (error) => toast.error(error.message),
    });

  const onProblem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason) return;
    actions.reportProblem.mutate(
      { reason, details: text.trim(), packageId: pkg.id },
      {
        onSuccess: () => {
          toast.success("Problem reported — the store and ODOS support will follow up");
          setPanel(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const onReschedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actions.reschedule.mutate(
      { note: text.trim(), packageId: pkg.id },
      {
        onSuccess: () => {
          toast.success("Reschedule requested — the store will confirm a new time");
          setPanel(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-4 border-t border-line pt-4">
      <div className="flex flex-wrap gap-2">
        {inTransit && (
          <Button size="sm" variant="accent" onClick={onConfirm} disabled={actions.confirmPackage.isPending}>
            <CheckCircle2 className="size-4" aria-hidden />
            {actions.confirmPackage.isPending ? "Confirming…" : "I received it"}
          </Button>
        )}
        {inTransit && (
          <Button size="sm" variant="outline" onClick={() => open("reschedule")} aria-expanded={panel === "reschedule"}>
            <CalendarClock className="size-4" aria-hidden />
            Reschedule
          </Button>
        )}
        {(inTransit || delivered) && (
          <Button size="sm" variant="outline" onClick={() => open("problem")} aria-expanded={panel === "problem"}>
            <TriangleAlert className="size-4" aria-hidden />
            Report a problem
          </Button>
        )}
        {delivered && (
          <ButtonLink size="sm" variant="outline" href="/account?tab=returns">
            <RotateCcw className="size-4" aria-hidden />
            Return an item
          </ButtonLink>
        )}
        {store && (
          <ButtonLink size="sm" variant="ghost" href={`/stores/${encodeURIComponent(store.slug)}/chat`}>
            <MessagesSquare className="size-4" aria-hidden />
            Chat with {store.name}
          </ButtonLink>
        )}
      </div>

      {panel === "problem" && (
        <form onSubmit={onProblem} className="space-y-3 rounded-xl bg-surface-muted/60 p-4">
          <SelectField
            id={`problem-${pkg.id}`}
            label="What went wrong?"
            value={reason}
            onValueChange={setReason}
            options={PROBLEM_REASONS}
            placeholder="Choose a reason"
          />
          <textarea
            rows={3}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anything that helps the store sort it out (optional)"
            aria-label="Problem details"
            className={textareaClass}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!reason || actions.reportProblem.isPending}>
              {actions.reportProblem.isPending ? "Sending…" : "Send report"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPanel(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {panel === "reschedule" && (
        <form onSubmit={onReschedule} className="space-y-3 rounded-xl bg-surface-muted/60 p-4">
          <label htmlFor={`reschedule-${pkg.id}`} className="block text-sm font-medium">
            When suits you better?
          </label>
          <textarea
            id={`reschedule-${pkg.id}`}
            rows={2}
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Tomorrow after 4pm, or leave with security"
            className={textareaClass}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={actions.reschedule.isPending}>
              {actions.reschedule.isPending ? "Sending…" : "Request new time"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPanel(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {pkg.status === "pending" && (
        <p className="text-xs text-muted">
          Waiting for {pkg.storeName} to confirm. <Link href="/orders" className="underline underline-offset-2">Back to orders</Link>
        </p>
      )}
    </div>
  );
}
