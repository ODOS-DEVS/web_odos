"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, EyeOff, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { QueryError } from "@/components/ui/query-error";
import { PageHeader, Panel, SkeletonRows } from "@/components/vendor/vendor-ui";
import {
  useCreateStoreSection,
  useDeleteStoreSection,
  useReorderStoreSections,
  useUpdateStoreSection,
  useVendorStoreSections,
} from "@/hooks/use-vendor-store";
import type { VendorStoreSection } from "@/types/vendor";

/** Sections are the rows a shopper scrolls on your storefront, in the order set here. */
export function StoreSectionsView() {
  const query = useVendorStoreSections();
  const create = useCreateStoreSection();
  const update = useUpdateStoreSection();
  const remove = useDeleteStoreSection();
  const reorder = useReorderStoreSections();

  const [title, setTitle] = useState("");
  const [deleting, setDeleting] = useState<VendorStoreSection | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const sections = query.data ?? [];

  const move = (index: number, direction: -1 | 1) => {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(
      next.map((s) => s.id),
      { onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't reorder your sections.") },
    );
  };

  if (query.isError) {
    return <QueryError title="We couldn't load your storefront sections" error={query.error} onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Storefront"
        description="Group your products into rows shoppers scroll through on your store page."
      />

      <Panel className="p-5">
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = title.trim();
            if (!trimmed) return;
            create.mutate(trimmed, {
              onSuccess: () => {
                toast.success(`"${trimmed}" added`);
                setTitle("");
              },
              onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't add that section."),
            });
          }}
        >
          <input
            className={`${inputClass} min-w-0 flex-1`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New section name, e.g. New arrivals"
            maxLength={80}
            aria-label="New section name"
          />
          <Button type="submit" disabled={create.isPending || !title.trim()}>
            <Plus className="size-4" aria-hidden />
            Add section
          </Button>
        </form>
      </Panel>

      {query.isPending ? (
        <SkeletonRows count={3} />
      ) : sections.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-10 text-muted" aria-hidden />}
          title="No sections yet"
          description="Without sections your storefront shows one long product list. Add a few to group what you sell."
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-line">
            {sections.map((section, index) => (
              <li key={section.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    aria-label={`Move ${section.title} up`}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => move(index, -1)}
                    className="press grid size-6 place-items-center rounded text-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${section.title} down`}
                    disabled={index === sections.length - 1 || reorder.isPending}
                    onClick={() => move(index, 1)}
                    className="press grid size-6 place-items-center rounded text-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" aria-hidden />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  {renamingId === section.id ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        update.mutate(
                          { id: section.id, title: renameValue.trim() },
                          {
                            onSuccess: () => {
                              toast.success("Section renamed");
                              setRenamingId(null);
                            },
                            onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't rename that section."),
                          },
                        );
                      }}
                    >
                      <input
                        className={`${inputClass} h-9`}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        maxLength={80}
                        aria-label="Section name"
                        autoFocus
                      />
                      <Button type="submit" size="sm" disabled={update.isPending}>
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(section.id);
                        setRenameValue(section.title);
                      }}
                      className="press text-left"
                    >
                      <span className="block font-medium">{section.title}</span>
                      <span className="block text-xs text-muted">
                        {section.productCount} product{section.productCount === 1 ? "" : "s"} · tap to rename
                      </span>
                    </button>
                  )}
                </div>

                <Badge tone={section.isActive ? "success" : "neutral"}>{section.isActive ? "Visible" : "Hidden"}</Badge>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate(
                      { id: section.id, isActive: !section.isActive },
                      {
                        onSuccess: () => toast.success(section.isActive ? "Section hidden" : "Section is now visible"),
                        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't update that section."),
                      },
                    )
                  }
                >
                  {section.isActive ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  {section.isActive ? "Hide" : "Show"}
                </Button>

                <Button type="button" variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(section)}>
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only">Delete {section.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        title={`Delete "${deleting?.title}"?`}
        description="The section disappears from your storefront. The products in it stay in your catalogue."
        confirmLabel="Delete section"
        pending={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => toast.success("Section deleted"),
            onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't delete that section."),
            onSettled: () => setDeleting(null),
          });
        }}
      />
    </div>
  );
}
