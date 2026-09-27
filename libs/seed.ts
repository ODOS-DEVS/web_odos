/** Stable 0–359 hue from any string, so a missing image always falls back to the same colour. */
export function hueFromSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 360;
}

/** First letters of the first two words: "Green Basket" → "GB". */
export function monogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}
