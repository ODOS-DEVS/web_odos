/**
 * next/image loader: let Cloudinary's CDN resize and re-encode images instead of routing every
 * original (often 1–2 MB) through the Next.js image optimiser. Non-Cloudinary URLs are served as-is.
 */

/**
 * Unsharp mask applied only when the image is actually being downscaled.
 *
 * Cloudinary's resampler is softer than a good Lanczos filter. Measured against a real catalogue
 * photo, a downscale retained only 65–84% of the original's edge energy depending on the factor —
 * that deficit is what made product cards look very slightly blurred next to the uploaded file.
 * 80 lands the result at 103–125% of a Lanczos resample across the widths next/image requests, and
 * it *raises* PSNR at the larger sizes (42.4 → 43.2 dB at w_1080), so it is restoring detail the
 * resampler dropped rather than manufacturing crispness.
 */
const DOWNSCALE_SHARPEN = 80;

export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) return src;

  // q_95 is the measured point where the delivered image stops being distinguishable from the
  // stored original (PSNR 46.5 dB, edge energy identical to the source). q_auto:best sits at
  // 44.2 dB — close, but this is a marketplace where the photograph is the product.
  // f_auto picks AVIF/WebP per browser; c_limit never upscales a modest original.
  const transformation = `f_auto,q_${quality ?? 95},w_${width},c_limit`;

  // Sharpen only where a real downscale happens. Applied unconditionally it would crisp an image
  // that was never resized — measured at 161% of the original's edge energy with PSNR dropping to
  // 42.9. Conditionals are their own transformation component, hence slash-separated.
  const sharpen = `if_iw_gt_${width}/e_sharpen:${DOWNSCALE_SHARPEN}/if_end`;

  return src.replace("/upload/", `/upload/${sharpen}/${transformation}/`);
}
