"use client";

import { useState, type FormEvent } from "react";
import { Gift, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { QueryError } from "@/components/ui/query-error";
import { TogglePill } from "@/components/ui/toggle-pill";
import {
  useDeleteVendorVoucher,
  useGiftVendorVoucher,
  useSaveVendorVoucher,
  useVendorVouchers,
} from "@/hooks/use-vendor-ops";
import { formatDate, formatMoney } from "@/libs/format";
import type { VendorVoucher, VendorVoucherInput } from "@/types/vendor";

const AVAILABILITY = [
  { value: "auto", label: "Automatic", help: "Applies for eligible shoppers without claiming first." },
  { value: "claim", label: "Claimable", help: "Shoppers save it from your store page into their wallet." },
  { value: "assigned", label: "Gifted", help: "Only shoppers you send it to can use it." },
] as const;

const APPROVAL_TONE: Record<string, BadgeTone> = { approved: "success", pending: "warning", rejected: "danger" };

type FormState = {
  code: string;
  title: string;
  description: string;
  availability: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  minSubtotal: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  endsAt: string;
};

const EMPTY_FORM: FormState = {
  code: "",
  title: "",
  description: "",
  availability: "claim",
  discountType: "percent",
  discountValue: "",
  minSubtotal: "",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "",
  endsAt: "",
};

function formFrom(v: VendorVoucher): FormState {
  return {
    code: v.code,
    title: v.title,
    description: v.description ?? "",
    availability: v.availability,
    discountType: v.discountType === "fixed" ? "fixed" : "percent",
    discountValue: String(v.discountValue),
    minSubtotal: v.minSubtotal ? String(v.minSubtotal) : "",
    maxDiscount: v.maxDiscount ? String(v.maxDiscount) : "",
    usageLimit: v.usageLimit ? String(v.usageLimit) : "",
    perUserLimit: v.perUserLimit ? String(v.perUserLimit) : "",
    endsAt: v.endsAt ? v.endsAt.slice(0, 10) : "",
  };
}

const num = (raw: string): number | null => {
  const n = Number(raw);
  return raw.trim() && Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * The PATCH is a whole-record write (same trap as products), so an edit —
 * including a mere activate/deactivate — sends the complete payload.
 */
function toInput(form: FormState, isActive: boolean): VendorVoucherInput {
  return {
    code: form.code,
    title: form.title,
    description: form.description || null,
    availability: form.availability,
    discountType: form.discountType,
    discountValue: Number(form.discountValue) || 0,
    minSubtotal: num(form.minSubtotal) ?? 0,
    maxDiscount: form.discountType === "percent" ? num(form.maxDiscount) : null,
    usageLimit: num(form.usageLimit) ? Math.floor(num(form.usageLimit)!) : null,
    perUserLimit: num(form.perUserLimit) ? Math.floor(num(form.perUserLimit)!) : null,
    isActive,
    startsAt: null,
    endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:59`).toISOString() : null,
  };
}

function rewardPreview(form: FormState): string {
  const value = Number(form.discountValue);
  if (!Number.isFinite(value) || value <= 0) return "";
  const reward = form.discountType === "percent" ? `${value}% off` : `${formatMoney(value)} off`;
  const min = num(form.minSubtotal);
  return min ? `${reward} orders over ${formatMoney(min)}` : reward;
}

function VoucherForm({ editing, onClose }: { editing: VendorVoucher | null; onClose: () => void }) {
  const save = useSaveVendorVoucher();
  const [form, setForm] = useState<FormState>(editing ? formFrom(editing) : EMPTY_FORM);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.code.trim().length < 2 || form.title.trim().length < 2) {
      toast.error("Give the voucher a code and a title.");
      return;
    }
    if (!(Number(form.discountValue) > 0)) {
      toast.error("Enter the discount value.");
      return;
    }
    if (form.discountType === "percent" && Number(form.discountValue) > 100) {
      toast.error("A percentage discount can’t be over 100.");
      return;
    }
    save.mutate(
      { id: editing?.id ?? null, input: toInput(form, editing?.isActive ?? true) },
      {
        onSuccess: (saved) => {
          toast.success(
            saved.approvalStatus === "pending"
              ? "Saved — ODOS reviews new promotions before shoppers see them."
              : "Voucher saved",
          );
          onClose();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn’t save this voucher."),
      },
    );
  };

  const preview = rewardPreview(form);

  return (
    <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="voucher-code"
          label="Code"
          value={form.code}
          onChange={(e) => set({ code: e.target.value.toUpperCase() })}
          placeholder="SAVE10"
          maxLength={40}
          required
        />
        <Field
          id="voucher-title"
          label="Title"
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="10% off everything"
          maxLength={120}
          required
        />
      </div>

      <div>
        <label htmlFor="voucher-description" className="mb-1.5 block text-sm font-medium">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="voucher-description"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
          maxLength={255}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Who can use it</legend>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY.map((option) => (
            <TogglePill key={option.value} selected={form.availability === option.value} onClick={() => set({ availability: option.value })}>
              {option.label}
            </TogglePill>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">{AVAILABILITY.find((o) => o.value === form.availability)?.help}</p>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Discount</legend>
        <div className="flex gap-2">
          <TogglePill selected={form.discountType === "percent"} onClick={() => set({ discountType: "percent" })}>
            Percent
          </TogglePill>
          <TogglePill selected={form.discountType === "fixed"} onClick={() => set({ discountType: "fixed" })}>
            Fixed amount
          </TogglePill>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="voucher-value"
          label={form.discountType === "percent" ? "Percent off" : "Amount off (GHS)"}
          type="number"
          min="0.01"
          max={form.discountType === "percent" ? "100" : undefined}
          step="0.01"
          inputMode="decimal"
          value={form.discountValue}
          onChange={(e) => set({ discountValue: e.target.value })}
          required
        />
        <Field
          id="voucher-min"
          label="Minimum order (GHS)"
          hint={<span className="text-muted">optional</span>}
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={form.minSubtotal}
          onChange={(e) => set({ minSubtotal: e.target.value })}
        />
        {form.discountType === "percent" && (
          <Field
            id="voucher-cap"
            label="Max discount (GHS)"
            hint={<span className="text-muted">optional cap</span>}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={form.maxDiscount}
            onChange={(e) => set({ maxDiscount: e.target.value })}
          />
        )}
        <Field
          id="voucher-ends"
          label="Expires"
          hint={<span className="text-muted">optional</span>}
          type="date"
          value={form.endsAt}
          onChange={(e) => set({ endsAt: e.target.value })}
        />
        <Field
          id="voucher-usage"
          label="Total uses"
          hint={<span className="text-muted">blank = unlimited</span>}
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={form.usageLimit}
          onChange={(e) => set({ usageLimit: e.target.value })}
        />
        <Field
          id="voucher-per-user"
          label="Uses per shopper"
          hint={<span className="text-muted">blank = unlimited</span>}
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={form.perUserLimit}
          onChange={(e) => set({ perUserLimit: e.target.value })}
        />
      </div>

      {preview && (
        <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm">
          Shoppers will see: <strong className="font-semibold">{preview}</strong>
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : editing ? "Save changes" : "Create voucher"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function GiftForm({ voucher, onClose }: { voucher: VendorVoucher; onClose: () => void }) {
  const gift = useGiftVendorVoucher();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    gift.mutate(
      { id: voucher.id, email, note: note || undefined },
      {
        onSuccess: () => {
          toast.success(`${voucher.code} sent to ${email.trim().toLowerCase()}`);
          onClose();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn’t gift this voucher."),
      },
    );
  };

  return (
    <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-5">
      <p className="text-sm text-muted">
        Send <strong className="font-semibold text-foreground">{voucher.code}</strong> ({voucher.rewardText}) to one shopper. It lands in their
        voucher wallet, addressed to them alone.
      </p>
      <Field
        id="gift-email"
        label="Shopper’s email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="them@example.com"
        required
      />
      <Field
        id="gift-note"
        label="Note"
        hint={<span className="text-muted">optional</span>}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={255}
        placeholder="Thanks for being a regular!"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={gift.isPending || !email.trim()}>
          {gift.isPending ? "Sending…" : "Send voucher"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} disabled={gift.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function VoucherCard({
  voucher,
  onEdit,
  onGift,
  onDelete,
  onToggle,
  toggling,
}: {
  voucher: VendorVoucher;
  onEdit: () => void;
  onGift: () => void;
  onDelete: () => void;
  onToggle: () => void;
  toggling: boolean;
}) {
  const live = voucher.isActive && voucher.approvalStatus === "approved";
  return (
    <li className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-semibold tracking-wide">{voucher.code}</p>
            {voucher.approvalStatus !== "approved" && (
              <Badge tone={APPROVAL_TONE[voucher.approvalStatus] ?? "neutral"}>
                {voucher.approvalStatus === "pending" ? "Awaiting ODOS review" : "Rejected by ODOS"}
              </Badge>
            )}
            <Badge tone={live ? "success" : "neutral"}>{live ? "Live" : voucher.isActive ? "Not live yet" : "Paused"}</Badge>
          </div>
          <p className="mt-1 truncate text-sm font-medium">{voucher.title}</p>
          <p className="mt-0.5 text-sm text-muted">{voucher.rewardText}</p>
          {voucher.approvalStatus === "rejected" && voucher.reviewNotes && (
            <p className="mt-1.5 text-xs text-danger">ODOS: {voucher.reviewNotes}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={onEdit} aria-label={`Edit ${voucher.code}`} className="press grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground">
            <Pencil className="size-4" aria-hidden />
          </button>
          {voucher.availability === "assigned" && (
            <button type="button" onClick={onGift} aria-label={`Gift ${voucher.code}`} className="press grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground">
              <Gift className="size-4" aria-hidden />
            </button>
          )}
          <button type="button" onClick={onDelete} aria-label={`Archive ${voucher.code}`} className="press grid size-9 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger">
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
        <p>
          {voucher.redemptionCount} {voucher.redemptionCount === 1 ? "use" : "uses"}
          {voucher.usageLimit !== null && <> of {voucher.usageLimit}</>} · {formatMoney(voucher.totalDiscountAmount)} given
          {voucher.endsAt && (
            <>
              {" · Expires "}
              <time dateTime={voucher.endsAt}>{formatDate(voucher.endsAt)}</time>
            </>
          )}
        </p>
        <Button size="sm" variant="outline" onClick={onToggle} disabled={toggling}>
          {toggling ? "Saving…" : voucher.isActive ? "Pause" : "Resume"}
        </Button>
      </div>
    </li>
  );
}

export function VendorVouchersTab() {
  const vouchers = useVendorVouchers();
  const save = useSaveVendorVoucher();
  const remove = useDeleteVendorVoucher();

  // "closed" | "create" | the voucher being edited / gifted / deleted.
  const [editor, setEditor] = useState<"closed" | "create" | VendorVoucher>("closed");
  const [gifting, setGifting] = useState<VendorVoucher | null>(null);
  const [deleting, setDeleting] = useState<VendorVoucher | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  if (vouchers.isPending) return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  if (vouchers.isError) return <QueryError error={vouchers.error} onRetry={() => vouchers.refetch()} />;

  const rows = vouchers.data ?? [];

  const toggle = (voucher: VendorVoucher) => {
    setTogglingId(voucher.id);
    save.mutate(
      // Whole-record write: the full form rebuilt from the row, with only isActive flipped.
      { id: voucher.id, input: toInput(formFrom(voucher), !voucher.isActive) },
      {
        onSuccess: (updated) => toast.success(updated.isActive ? `${updated.code} resumed` : `${updated.code} paused`),
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn’t update this voucher."),
        onSettled: () => setTogglingId(null),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Discount codes for your store. New ones are checked by ODOS before shoppers can see them.
        </p>
        <Button size="sm" onClick={() => setEditor("create")}>
          <Plus className="size-4" aria-hidden />
          New voucher
        </Button>
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((voucher) => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              onEdit={() => setEditor(voucher)}
              onGift={() => setGifting(voucher)}
              onDelete={() => setDeleting(voucher)}
              onToggle={() => toggle(voucher)}
              toggling={togglingId === voucher.id}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<Ticket className="size-10 text-muted" aria-hidden />}
          title="No vouchers yet"
          description="Create a discount code to bring shoppers back — percent or fixed amount, claimable or gifted."
        />
      )}

      <Drawer
        open={editor !== "closed"}
        onClose={() => setEditor("closed")}
        title={editor === "create" || editor === "closed" ? "New voucher" : `Edit ${editor.code}`}
        labelId="vendor-voucher-editor-heading"
      >
        {editor !== "closed" && (
          <VoucherForm
            // Keyed so switching between rows resets the form state.
            key={editor === "create" ? "create" : editor.id}
            editing={editor === "create" ? null : editor}
            onClose={() => setEditor("closed")}
          />
        )}
      </Drawer>

      <Drawer open={gifting !== null} onClose={() => setGifting(null)} title="Gift voucher" labelId="vendor-voucher-gift-heading">
        {gifting && <GiftForm voucher={gifting} onClose={() => setGifting(null)} />}
      </Drawer>

      <ConfirmDialog
        open={deleting !== null}
        title={`Archive ${deleting?.code}?`}
        description="Shoppers can no longer use it. Its redemption history stays on record."
        confirmLabel={remove.isPending ? "Archiving…" : "Archive voucher"}
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(`${deleting.code} archived`);
              setDeleting(null);
            },
            onError: (e) => {
              setDeleting(null);
              toast.error(e instanceof Error ? e.message : "We couldn’t archive this voucher.");
            },
          })
        }
      />
    </div>
  );
}
