"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { ImagePlus, PackageSearch, X } from "lucide-react";
import type { ReturnEligibleItem, ReturnRequestType } from "@/types/returns";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, inputClass } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useReturnRequestForItem, useReturns } from "@/hooks/use-returns";
import { cn } from "@/libs/cn";
import { formatDate, formatMoney } from "@/libs/format";
import { MOCK_RETURN_ELIGIBLE_ITEMS } from "@/mocks/returns.mock";

const REQUEST_TYPES: { id: ReturnRequestType; label: string }[] = [
  { id: "refund", label: "Refund" },
  { id: "exchange", label: "Exchange" },
  { id: "return", label: "Return" },
];

const STATUS_TONE: Record<string, BadgeTone> = { pending: "warning", approved: "success", rejected: "danger" };
const STATUS_LABEL: Record<string, string> = { pending: "Pending review", approved: "Approved", rejected: "Rejected" };

const outlinePill = "press inline-flex items-center justify-center rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent-soft";

function ItemSummary({ item }: { item: ReturnEligibleItem }) {
  return (
    <div className="flex items-center gap-3">
      <Media src={item.imageUrl} name={item.name} sizes="48px" className="size-12 shrink-0 rounded-xl" />
      <div className="min-w-0">
        <p className="truncate font-semibold">{item.name}</p>
        <p className="truncate text-xs text-muted">
          {item.variant} · Delivered {formatDate(item.deliveredAt)}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Qty {item.quantity} · {formatMoney(item.unitPrice)}
        </p>
      </div>
    </div>
  );
}

function ReturnRequestForm({ item, onCancel, onSubmitted }: { item: ReturnEligibleItem; onCancel: () => void; onSubmitted: () => void }) {
  const { submit } = useReturns();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<ReturnRequestType>("refund");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [photoNames, setPhotoNames] = useState<string[]>([]);

  const onAddPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setPhotoNames((prev) => [...prev, ...files.map((f) => f.name)].slice(0, 3));
    event.target.value = "";
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason.trim()) return;
    submit({ itemId: item.id, type, quantity, reason: reason.trim(), details: details.trim(), photoNames });
    toast.success("Return request submitted");
    onSubmitted();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onCancel} className={outlinePill}>
          Cancel
        </button>
        <h2 className="text-base font-semibold tracking-normal">New return request</h2>
        <button type="submit" className={outlinePill}>
          Submit
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <ItemSummary item={item} />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h3 className="text-sm font-semibold">Request type</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {REQUEST_TYPES.map((t) => (
            <TogglePill key={t.id} selected={type === t.id} onClick={() => setType(t.id)}>
              {t.label}
            </TogglePill>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Quantity</h3>
            <p className="mt-0.5 text-xs text-muted">Select how many units of this item should be reviewed or returned.</p>
          </div>
          <QuantityStepper value={quantity} onChange={setQuantity} max={item.quantity} className="shrink-0" />
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <Field
          id="reason"
          label="Reason"
          placeholder="What's the issue with this item?"
          hint="Help us specify this issue"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div>
          <label htmlFor="details" className="mb-1.5 block text-sm font-medium">
            Extra details
          </label>
          <textarea
            id="details"
            rows={3}
            placeholder="Any extra details?"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className={cn(inputClass, "h-auto min-h-24 resize-none py-3")}
          />
          <p className="mt-1.5 text-xs text-muted">Optional. Add helpful details like damage, sizing, or incorrect colour.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h3 className="text-sm font-semibold">Photo evidence</h3>
        <p className="mt-0.5 text-xs text-muted">Add up to 3 photos to support your request</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoNames.length >= 3}
            className="press inline-flex items-center gap-1.5 rounded-full border border-accent px-3.5 py-1.5 text-sm font-medium text-accent hover:bg-accent-soft disabled:pointer-events-none disabled:opacity-50"
          >
            <ImagePlus className="size-4" aria-hidden />
            Add photo
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={onAddPhotos} className="sr-only" />
        </div>

        {photoNames.length > 0 && (
          <ul className="mt-3 space-y-2">
            {photoNames.map((name, i) => (
              <li key={`${name}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                <span className="truncate">{name}</span>
                <button
                  type="button"
                  onClick={() => setPhotoNames((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${name}`}
                  className="press shrink-0 rounded-full p-1 text-muted hover:bg-surface-muted"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" variant="accent" size="lg" className="w-full">
        Submit Request
      </Button>
    </form>
  );
}

function ReturnItemCard({ item, onStart }: { item: ReturnEligibleItem; onStart: () => void }) {
  const request = useReturnRequestForItem(item.id);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <ItemSummary item={item} />
        {request ? (
          <Badge tone={STATUS_TONE[request.status]} className="shrink-0">
            {STATUS_LABEL[request.status]}
          </Badge>
        ) : (
          <button type="button" onClick={onStart} className={`${outlinePill} shrink-0`}>
            Start request
          </button>
        )}
      </div>
      {!request && <p className="mt-3 text-xs text-muted">Photos optional</p>}
    </div>
  );
}

export function ReturnsTab() {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const items = MOCK_RETURN_ELIGIBLE_ITEMS;
  const activeItem = items.find((i) => i.id === activeItemId) ?? null;

  if (activeItem) {
    return (
      <ReturnRequestForm
        item={activeItem}
        onCancel={() => setActiveItemId(null)}
        onSubmitted={() => setActiveItemId(null)}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch className="size-6 text-muted" aria-hidden />}
        iconBadge
        title="Nothing to return yet"
        description="Delivered items show up here with an option to request a refund, exchange, or return."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ReturnItemCard key={item.id} item={item} onStart={() => setActiveItemId(item.id)} />
      ))}
    </div>
  );
}
