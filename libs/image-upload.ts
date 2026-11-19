/**
 * Client-side rules for product and verification images.
 *
 * Mirrors `app/services/media_service.py`. The backend sniffs magic bytes rather than trusting
 * the Content-Type header, so these checks are convenience, not security — their job is to tell
 * someone *before* an upload why a file will be refused, instead of after a slow round trip.
 *
 * The format list matters more than it looks: `accept="image/*"` lets an iPhone offer HEIC,
 * which the API rejects outright.
 */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** For an `<input accept>` — includes extensions, as some browsers match on those. */
export const IMAGE_ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGES_PER_REQUEST = 10;
export const MIN_IMAGE_DIMENSION = 16;

/**
 * A short, human label for whatever was picked. Takes the subtype for an image ("HEIC") but the
 * file extension for anything else, because "APPLICATION/PDF isn't supported" reads like a bug.
 */
function describeType(file: File): string {
  if (file.type.startsWith("image/")) return file.type.slice("image/".length).toUpperCase();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : null;
  return extension ? `.${extension.toLowerCase()}` : "That file type";
}

const prettyBytes = (bytes: number) => `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`;

export type ImageRejection = { file: File; reason: string };

/**
 * Splits a selection into what can be uploaded and what cannot, with a reason per rejection.
 *
 * `existingCount` is the number already on the product, because the per-request cap applies to
 * what is sent, and silently dropping the overflow would look like files vanishing.
 */
export function screenImages(
  files: File[],
  { existingCount = 0, alreadySelected = [] }: { existingCount?: number; alreadySelected?: File[] } = {},
): { accepted: File[]; rejected: ImageRejection[] } {
  const accepted: File[] = [];
  const rejected: ImageRejection[] = [];
  // Same name *and* size: a plausible re-pick of the same file, without reading its contents.
  const seen = new Set(alreadySelected.map((f) => `${f.name}:${f.size}`));

  for (const file of files) {
    const key = `${file.name}:${file.size}`;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      rejected.push({
        file,
        reason: `${describeType(file)} isn't supported — use JPG, PNG or WebP.`,
      });
      continue;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      rejected.push({ file, reason: `${prettyBytes(file.size)} is over the ${prettyBytes(MAX_IMAGE_BYTES)} limit.` });
      continue;
    }
    if (seen.has(key)) {
      rejected.push({ file, reason: "Already selected." });
      continue;
    }
    if (existingCount + accepted.length >= MAX_IMAGES_PER_REQUEST) {
      rejected.push({ file, reason: `Only ${MAX_IMAGES_PER_REQUEST} images can be uploaded at once.` });
      continue;
    }

    seen.add(key);
    accepted.push(file);
  }

  return { accepted, rejected };
}

/**
 * Rejects an image too small for the API's 16×16 floor before it is sent.
 *
 * Async because it has to decode the file. Resolves `null` when the image is fine, or a reason
 * when it is not; a file the browser cannot decode at all is reported rather than assumed good.
 */
export function checkImageDimensions(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(
        image.width < MIN_IMAGE_DIMENSION || image.height < MIN_IMAGE_DIMENSION
          ? `Too small — images must be at least ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION} pixels.`
          : null,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("That file couldn't be read as an image.");
    };
    image.src = url;
  });
}
