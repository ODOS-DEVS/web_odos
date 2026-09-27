/**
 * next/image loader: let Cloudinary's CDN resize and re-encode images instead of routing every original
 * (often 1–2 MB) through the Next.js image optimiser. Non-Cloudinary URLs are served as-is.
 */
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) return src;
  // f_auto: best format for the browser (AVIF/WebP), c_limit: never upscale, q_auto: perceptual quality.
  return src.replace("/upload/", `/upload/f_auto,q_${quality ?? "auto"},w_${width},c_limit/`);
}
