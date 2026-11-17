/**
 * Stable 0–359 hue from any string, so a missing image always falls back to the same colour.
 *
 * Tolerates a missing name: these feed decorative fallbacks, and a field that arrives under an
 * unexpected key (or not at all) must not take down the page rendering it.
 */
export function hueFromSeed(seed: string | null | undefined) {
  if (!seed) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 360;
}

/** First letters of the first two words: "Green Basket" → "GB". */
export function monogram(name: string | null | undefined) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}
