import { describe, it, expect } from "vitest";

const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("Pro Voleybol palet kontrastı (WCAG)", () => {
  const surface = "#16131D";
  const textPairs: [string, string, string][] = [
    ["ink", "#FBF7F0", "#0C0A10"],
    ["ink-2/surface", "#D8CEC2", surface],
    ["ink-3/surface", "#B3A698", surface],
    ["primary/surface", "#F5B83D", surface],
    ["live/surface", "#FF5C77", surface],
    ["done/surface", "#8EE058", surface],
    ["selected-text/surface", "#FF8FA3", surface],
    ["warn/surface", "#FFD166", surface],
    ["orchid/surface", "#E09EFF", surface],
    ["form-loss/surface", "#FF8599", surface],
    ["primary-fg/primary", "#1C1202", "#F5B83D"],
    ["orchid fg/orchid", "#2A0B3A", "#E09EFF"],
    ["white/selected-strong", "#FFFFFF", "#B81D3A"],
  ];
  it.each(textPairs)("%s ≥ 4.5", (_n, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
