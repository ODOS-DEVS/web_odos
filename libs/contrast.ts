/**
 * Pick readable ink for an arbitrary background colour.
 *
 * Promo banner accents are supplied by whoever schedules the banner, so the card cannot assume a
 * dark background. Hardcoding white text makes a pale accent — or no accent at all, where the card
 * falls back to a light surface — unreadable.
 *
 * Uses WCAG relative luminance rather than a naive average, because the eye is far more sensitive
 * to green than to blue and an average misjudges colours like `#00ff00`.
 */
function channelLuminance(value: number) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, "");
  const full = clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** 0 (black) to 1 (white), or `null` for anything unparseable. */
export function relativeLuminance(color: string): number | null {
  const rgb = parseHex(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * `"light"` means light *ink* (white text) is the readable choice. Anything we cannot parse —
 * a CSS variable, a gradient, or no colour at all — returns `"dark"`, because the fallback
 * surface behind these cards is light in light mode.
 */
export function inkFor(background: string | null | undefined): "light" | "dark" {
  if (!background) return "dark";
  const luminance = relativeLuminance(background);
  if (luminance === null) return "dark";
  // 0.45 rather than 0.5: white-on-mid-tone reads worse than dark-on-mid-tone.
  return luminance < 0.45 ? "light" : "dark";
}
