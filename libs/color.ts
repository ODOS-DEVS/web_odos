import { hueFromSeed } from "./seed";

/** Common product colour names → a swatch colour, lowercased for lookup. */
const NAMED_SWATCHES: Record<string, string> = {
  black: "#0a0a0a",
  white: "#f8f8f6",
  natural: "#e8dcc8",
  charcoal: "#36373a",
  tan: "#c9986b",
  brown: "#6b4423",
  beige: "#e3d5b8",
  cream: "#f2ead9",
  ivory: "#f4f0e6",
  gold: "#c9a227",
  silver: "#c7c9cc",
  gray: "#8a8d91",
  grey: "#8a8d91",
  navy: "#1c2951",
  blue: "#2563eb",
  "sky blue": "#7dd3fc",
  teal: "#0d9488",
  green: "#16a34a",
  olive: "#5f6b3a",
  red: "#dc2626",
  maroon: "#7f1d2e",
  rust: "#a3462a",
  terracotta: "#c1673f",
  orange: "#ea580c",
  yellow: "#eab308",
  pink: "#ec4899",
  purple: "#9333ea",
  indigo: "#3730a3",
  lavender: "#c4b5fd",
};

/**
 * Best-effort swatch colour for a product's colour name. Falls back to a stable hue derived from the
 * name itself (same trick as `Media`'s placeholder tiles) for anything not in the table above, so an
 * unrecognised colour still renders a consistent, distinct swatch instead of a blank one.
 */
export function swatchColor(name: string): string {
  const known = NAMED_SWATCHES[name.trim().toLowerCase()];
  if (known) return known;
  return `oklch(0.7 0.12 ${hueFromSeed(name)})`;
}
