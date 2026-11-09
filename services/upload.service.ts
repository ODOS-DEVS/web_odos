import CONFIG from "@/utils/config";

/** Largest photo we upload; Cloudinary resizes it anyway. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const canUploadPhotos = () => Boolean(CONFIG.CLOUDINARY_CLOUD_NAME && CONFIG.CLOUDINARY_UPLOAD_PRESET);

/**
 * Uploads an image straight from the browser to Cloudinary (unsigned preset) and returns its HTTPS URL,
 * which is what the ODOS API stores (`avatar_url`, max 500 characters). Not routed through `apiFetch`:
 * this is a third-party host, and the shopper's ODOS token must never be sent to it.
 */
export async function uploadPhoto(file: File, folder = "odos/avatars"): Promise<string> {
  if (!canUploadPhotos()) throw new Error("Photo upload isn’t set up on this site yet.");
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("That photo is too large (5 MB max).");

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CONFIG.CLOUDINARY_UPLOAD_PRESET);
  form.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await response.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!response.ok || !data?.secure_url) throw new Error(data?.error?.message ?? "Upload failed. Please try again.");
  return data.secure_url;
}
