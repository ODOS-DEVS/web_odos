/**
 * next/image loader: let Cloudinary's CDN resize and re-encode images instead of routing every original
 * (often 1–2 MB) through the Next.js image optimiser. Non-Cloudinary URLs are served as-is.
 */
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) return src;
  // f_auto: best format for the browser (AVIF/WebP). c_limit: never upscale, so a
  // modest original is delivered at its own size instead of a soft larger one.
  //
  // q_auto:best rather than a bare q_auto, which resolves to q_auto:good — measured
  // on a real product photo at w_1080, "good" lands at 61KB and "best" at 78KB. That
  // 16KB is exactly the fabric texture and edge detail a shopper zooms in to judge,
  // and it is the difference people were seeing between the file they uploaded and
  // the one the site showed back.
  return src.replace("/upload/", `/upload/f_auto,q_${quality ?? "auto:best"},w_${width},c_limit/`);
}
