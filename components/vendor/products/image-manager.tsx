"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { GripVertical, ImagePlus, Star, Trash2, TriangleAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/libs/cn";
import {
  IMAGE_ACCEPT_ATTR,
  MAX_IMAGES_PER_REQUEST,
  checkImageDimensions,
  screenImages,
  type ImageRejection,
} from "@/libs/image-upload";

/** A slot in the gallery: either already saved on the product, or chosen and not yet uploaded. */
export type GallerySlot =
  | { kind: "saved"; url: string }
  | { kind: "new"; file: File; previewUrl: string };

export const slotKey = (slot: GallerySlot) => (slot.kind === "saved" ? slot.url : `${slot.file.name}:${slot.file.size}`);

/**
 * Product gallery management: add, reorder, choose the cover, remove.
 *
 * Order *is* the cover. The API takes `image_urls` and sets `image_url` to its first entry, so
 * "make cover" is a move to position 0 rather than a separate flag — one source of truth, and no
 * way for the badge and the stored cover to disagree.
 *
 * One honest limit: the API appends newly uploaded files after the existing gallery, so a
 * brand-new image cannot be made the cover in the same save. The note below says so instead of
 * letting someone drag it to the front and quietly get something else.
 */
export function ImageManager({
  slots,
  onChange,
  disabled,
}: {
  slots: GallerySlot[];
  onChange: (next: GallerySlot[]) => void;
  disabled?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [rejections, setRejections] = useState<ImageRejection[]>([]);
  const createdUrls = useRef<string[]>([]);

  // Object URLs leak until revoked, and a vendor can cycle through a lot of images while
  // building one product.
  useEffect(() => {
    const urls = createdUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addFiles = async (incoming: File[]) => {
    if (!incoming.length) return;
    const existingNew = slots.filter((s): s is Extract<GallerySlot, { kind: "new" }> => s.kind === "new");
    const { accepted, rejected } = screenImages(incoming, {
      existingCount: slots.length,
      alreadySelected: existingNew.map((s) => s.file),
    });

    // Dimensions need the file decoded, so they are checked after the cheap rules.
    const sized = await Promise.all(
      accepted.map(async (file) => ({ file, problem: await checkImageDimensions(file) })),
    );
    const good = sized.filter((s) => !s.problem).map((s) => s.file);
    const tooSmall = sized.filter((s) => s.problem).map((s) => ({ file: s.file, reason: s.problem! }));

    setRejections([...rejected, ...tooSmall]);

    const added: GallerySlot[] = good.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      createdUrls.current.push(previewUrl);
      return { kind: "new", file, previewUrl };
    });
    if (added.length) onChange([...slots, ...added]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slots.length || from === to) return;
    const next = [...slots];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const remove = (index: number) => {
    const slot = slots[index];
    if (slot.kind === "new") URL.revokeObjectURL(slot.previewUrl);
    onChange(slots.filter((_, i) => i !== index));
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (disabled) return;
    void addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const full = slots.length >= MAX_IMAGES_PER_REQUEST;

  return (
    <div className="space-y-3">
      {slots.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {slots.map((slot, index) => {
            const isCover = index === 0;
            const src = slot.kind === "saved" ? slot.url : slot.previewUrl;
            return (
              <li
                key={slotKey(slot)}
                draggable={!disabled}
                onDragStart={() => setDraggingIndex(index)}
                onDragEnd={() => setDraggingIndex(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggingIndex !== null) move(draggingIndex, index);
                  setDraggingIndex(null);
                }}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-surface-muted",
                  isCover ? "border-accent ring-1 ring-accent/30" : "border-line",
                  draggingIndex === index && "opacity-50",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Remote uploads and local previews. */}
                <img src={src} alt="" className="aspect-square w-full object-cover" />

                <span className="absolute top-1.5 left-1.5 flex items-center gap-1">
                  {isCover ? (
                    <Badge tone="accent">
                      <Star className="size-3 fill-current" aria-hidden />
                      Cover
                    </Badge>
                  ) : (
                    <span className="grid size-6 place-items-center rounded-full bg-surface/85 text-muted backdrop-blur-sm">
                      <GripVertical className="size-3.5" aria-hidden />
                    </span>
                  )}
                  {slot.kind === "new" && <Badge tone="success">New</Badge>}
                </span>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(index)}
                  aria-label={`Remove image ${index + 1}`}
                  className="press absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-foreground/80 text-background backdrop-blur-sm"
                >
                  <X className="size-3.5" aria-hidden />
                </button>

                <div className="flex items-center justify-between gap-1 border-t border-line bg-surface px-2 py-1.5">
                  {!isCover ? (
                    <button
                      type="button"
                      disabled={disabled || slot.kind === "new"}
                      onClick={() => move(index, 0)}
                      title={
                        slot.kind === "new"
                          ? "Save first — new images are added to the end, then can be made cover"
                          : undefined
                      }
                      className="press text-[11px] font-medium text-accent disabled:text-muted disabled:opacity-60"
                    >
                      Make cover
                    </button>
                  ) : (
                    <span className="text-[11px] text-muted">Shown first</span>
                  )}

                  <span className="flex gap-0.5">
                    <button
                      type="button"
                      disabled={disabled || index === 0}
                      onClick={() => move(index, index - 1)}
                      aria-label={`Move image ${index + 1} earlier`}
                      className="press grid size-6 place-items-center rounded text-muted hover:text-foreground disabled:opacity-30"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      disabled={disabled || index === slots.length - 1}
                      onClick={() => move(index, index + 1)}
                      aria-label={`Move image ${index + 1} later`}
                      className="press grid size-6 place-items-center rounded text-muted hover:text-foreground disabled:opacity-30"
                    >
                      ›
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "press flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed p-6 text-center text-sm",
          dragOver ? "border-accent bg-accent-soft/40" : "border-line hover:border-foreground",
          (disabled || full) && "pointer-events-none opacity-50",
        )}
      >
        <ImagePlus className="size-5 text-muted" aria-hidden />
        <span className="font-medium">
          {full ? `Maximum ${MAX_IMAGES_PER_REQUEST} images` : "Drop images here, or choose files"}
        </span>
        <span className="text-xs text-muted">
          Select several at once · JPG, PNG or WebP · up to 20MB each · {slots.length}/{MAX_IMAGES_PER_REQUEST}
        </span>
        <input
          type="file"
          accept={IMAGE_ACCEPT_ATTR}
          multiple
          disabled={disabled || full}
          className="sr-only"
          onChange={(event) => {
            void addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </label>

      {rejections.length > 0 && (
        <ul className="space-y-1 rounded-xl bg-danger-soft p-3">
          {rejections.map(({ file, reason }) => (
            <li key={`${file.name}:${file.size}`} className="flex items-start gap-2 text-xs text-danger">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                <strong>{file.name}</strong> — {reason}
              </span>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setRejections([])}
              className="press mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-danger underline"
            >
              <Trash2 className="size-3" aria-hidden />
              Dismiss
            </button>
          </li>
        </ul>
      )}

      {slots.some((s) => s.kind === "new") && (
        <p className="text-xs text-muted">
          The first image is the cover. New images are added to the end — save, then drag one to the front to
          make it the cover.
        </p>
      )}
    </div>
  );
}
